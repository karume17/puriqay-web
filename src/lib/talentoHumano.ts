import { supabase } from './supabase';
import { fetchNombres, type Nombre } from './permisos';

// ─── Asistencia ──────────────────────────────────────────────────────────────

export type EstadoAsistencia =
  'ASISTIO' | 'TARDANZA' | 'FALTA_JUSTIFICADA' | 'FALTA_INJUSTIFICADA' | 'PENDIENTE';
// PENDIENTE solo lo calcula la base (jornada sin terminar): no se puede asignar a mano.
export type EstadoEditable = Exclude<EstadoAsistencia, 'PENDIENTE'>;

export const ESTADOS_EDITABLES: EstadoEditable[] =
  ['ASISTIO', 'TARDANZA', 'FALTA_JUSTIFICADA', 'FALTA_INJUSTIFICADA'];

export const ESTADO_INFO: Record<EstadoAsistencia, { label: string; chip: string; barra: string }> = {
  ASISTIO: { label: 'Asistió', chip: 'bg-pq-teal-50 text-pq-teal-deep', barra: 'bg-pq-teal' },
  TARDANZA: { label: 'Tardanza', chip: 'bg-pq-marku-50 text-pq-marku-ink', barra: 'bg-pq-marku' },
  FALTA_JUSTIFICADA: { label: 'Falta justificada', chip: 'bg-blue-50 text-blue-700', barra: 'bg-blue-500' },
  FALTA_INJUSTIFICADA: { label: 'Falta injustificada', chip: 'bg-pq-error-50 text-pq-error', barra: 'bg-pq-error' },
  PENDIENTE: { label: 'Pendiente', chip: 'bg-pq-cream text-pq-ink-muted', barra: 'bg-pq-border' },
};

// Una fila de talento_asistencia_jornada(). correo y dni llegan null si no ves datos personales.
export type FilaAsistencia = {
  voluntario_id: string;
  nombre: string | null;
  apellido: string | null;
  correo: string | null;
  dni: string | null;
  rol: string | null;
  area_voluntario: string | null;
  preregistro: boolean;
  hora_llegada: string | null; // 'HH:MM:SS'
  estado: EstadoAsistencia;
  estado_automatico: EstadoAsistencia;
  observaciones: string | null;
  revisado: boolean;
  actualizado_por: string | null;
  actualizado_en: string | null;
};

export type CambioAsistencia = {
  id: string;
  created_at: string;
  editor_id: string | null;
  estado_antes: EstadoAsistencia | null;
  estado_despues: EstadoAsistencia;
  hora_antes: string | null;
  hora_despues: string | null;
  preregistro_antes: boolean | null;
  preregistro_despues: boolean | null;
  observaciones: string | null;
  editor: Nombre | null;
};

export const nombreCompleto = (p: { nombre?: string | null; apellido?: string | null }) =>
  [p.nombre, p.apellido].filter(Boolean).join(' ') || 'Sin nombre';

export const iniciales = (p: { nombre?: string | null; apellido?: string | null }) =>
  [p.nombre, p.apellido].map(s => s?.trim()[0] ?? '').join('').toUpperCase() || '?';

export const horaCorta = (h: string | null) => (h ? h.slice(0, 5) : '');

// Fecha y hora en Lima, sin depender de la zona del navegador.
export const fechaHora = (iso: string) =>
  new Date(iso).toLocaleString('es-PE', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima',
  });

export async function fetchAsistenciaJornada(jornadaId: string) {
  const { data, error } = await supabase.rpc('talento_asistencia_jornada', { p_jornada: jornadaId });
  return { filas: (data || []) as FilaAsistencia[], error };
}

export function guardarRevision(a: {
  jornadaId: string; voluntarioId: string; estado: EstadoEditable;
  hora: string | null; preregistro: boolean; observaciones: string;
}) {
  return supabase.rpc('guardar_revision_asistencia', {
    p_jornada: a.jornadaId, p_voluntario: a.voluntarioId, p_estado: a.estado,
    p_hora: a.hora, p_preregistro: a.preregistro, p_observaciones: a.observaciones,
  });
}

export async function fetchHistorialAsistencia(jornadaId: string, voluntarioId: string) {
  const { data, error } = await supabase
    .from('revisiones_asistencia_historial')
    .select('id, created_at, editor_id, estado_antes, estado_despues, hora_antes, hora_despues, preregistro_antes, preregistro_despues, observaciones')
    .eq('jornada_id', jornadaId)
    .eq('volunteer_id', voluntarioId)
    .order('created_at', { ascending: false });
  const filas = (data || []) as Omit<CambioAsistencia, 'editor'>[];
  const { nombres } = await fetchNombres(filas.map(f => f.editor_id));
  const cambios: CambioAsistencia[] = filas.map(f => ({ ...f, editor: f.editor_id ? nombres[f.editor_id] ?? null : null }));
  return { cambios, error };
}

export function describirCambio(c: CambioAsistencia): string {
  const partes: string[] = [];
  if (c.estado_antes !== c.estado_despues) {
    const antes = c.estado_antes ? ESTADO_INFO[c.estado_antes].label : '—';
    partes.push(`Cambió el estado de '${antes}' a '${ESTADO_INFO[c.estado_despues].label}'.`);
  }
  if (c.hora_despues && c.hora_antes !== c.hora_despues) partes.push(`Hora de llegada: ${horaCorta(c.hora_despues)}.`);
  if (c.preregistro_antes !== c.preregistro_despues) {
    partes.push(c.preregistro_despues ? 'Marcó el preregistro como confirmado.' : 'Quitó la confirmación del preregistro.');
  }
  if (c.observaciones) partes.push(`Observación: ${c.observaciones}`);
  return partes.join(' ') || 'Actualizó la asistencia.';
}

// ─── Incidencias ─────────────────────────────────────────────────────────────

export const TIPOS_INCIDENCIA = {
  FALTA_SALUD: 'Falta por salud (médica)',
  FALTA_PERSONAL: 'Falta por motivo personal',
  TARDANZA_OPERATIVA: 'Tardanza operativa',
  PERMISO: 'Permiso autorizado',
  OTRO: 'Otro',
} as const;
export type TipoIncidencia = keyof typeof TIPOS_INCIDENCIA;

export const SEVERIDADES = { BAJA: 'Baja', MEDIA: 'Media', ALTA: 'Alta' } as const;
export type Severidad = keyof typeof SEVERIDADES;
export const SEVERIDAD_CHIP: Record<Severidad, string> = {
  BAJA: 'bg-pq-cream text-pq-ink-muted',
  MEDIA: 'bg-pq-marku-50 text-pq-marku-ink',
  ALTA: 'bg-pq-error-50 text-pq-error',
};

export const ESTADOS_INCIDENCIA = {
  PENDIENTE: 'Pendiente', EN_SEGUIMIENTO: 'En seguimiento', RESUELTA: 'Resuelta',
} as const;
export type EstadoIncidencia = keyof typeof ESTADOS_INCIDENCIA;
export const ESTADO_INCIDENCIA_CHIP: Record<EstadoIncidencia, string> = {
  PENDIENTE: 'bg-pq-error-50 text-pq-error',
  EN_SEGUIMIENTO: 'bg-blue-50 text-blue-700',
  RESUELTA: 'bg-pq-teal-50 text-pq-teal-deep',
};

export type Incidencia = {
  id: string;
  volunteer_id: string;
  tipo: TipoIncidencia;
  severidad: Severidad;
  estado: EstadoIncidencia;
  detalle: string;
  ocurrio_en: string;
  incidencias_bitacora: { count: number }[];
};

export type EntradaBitacora = {
  id: string;
  created_at: string;
  autor_id: string | null;
  accion: 'REGISTRO' | 'CAMBIO_ESTADO' | 'NOTA';
  estado_antes: EstadoIncidencia | null;
  estado_despues: EstadoIncidencia | null;
  detalle: string;
  autor: Nombre | null;
};

export const ACCION_BITACORA = { REGISTRO: 'Registro', CAMBIO_ESTADO: 'Cambio de estado', NOTA: 'Nota' } as const;

export async function fetchIncidencias() {
  const { data, error } = await supabase
    .from('incidencias')
    .select('id, volunteer_id, tipo, severidad, estado, detalle, ocurrio_en, incidencias_bitacora(count)')
    .order('ocurrio_en', { ascending: false });
  const items = (data || []) as Incidencia[];
  const { nombres, error: nombresError } = await fetchNombres(items.map(i => i.volunteer_id));
  return { items, nombres, error: error || nombresError };
}

export async function fetchBitacora(incidenciaId: string) {
  const { data, error } = await supabase
    .from('incidencias_bitacora')
    .select('id, created_at, autor_id, accion, estado_antes, estado_despues, detalle')
    .eq('incidencia_id', incidenciaId)
    .order('created_at', { ascending: false });
  const filas = (data || []) as Omit<EntradaBitacora, 'autor'>[];
  const { nombres } = await fetchNombres(filas.map(f => f.autor_id));
  const entradas: EntradaBitacora[] = filas.map(f => ({ ...f, autor: f.autor_id ? nombres[f.autor_id] ?? null : null }));
  return { entradas, error };
}

// ─── Exportar ────────────────────────────────────────────────────────────────

// CSV con BOM para que Excel respete las tildes.
export function descargarCSV(nombreArchivo: string, filas: (string | number | null | undefined)[][]) {
  const celda = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = '\uFEFF' + filas.map(f => f.map(celda).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  a.click();
  URL.revokeObjectURL(url);
}