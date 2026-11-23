import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, Pencil, Check, X, Download, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { todayInLima } from '../lib/dates';
import LoadError from './LoadError';
import { BotonPrimario, BotonSecundario, inputClass, labelClass } from './JornadaUI';
import {
  ESTADO_INFO, ESTADOS_EDITABLES, nombreCompleto, iniciales, horaCorta, fechaHora,
  fetchAsistenciaJornada, guardarRevision, fetchHistorialAsistencia, describirCambio, descargarCSV,
  type EstadoAsistencia, type EstadoEditable, type FilaAsistencia, type CambioAsistencia,
} from '../lib/talentoHumano.ts';

type JornadaOpt = { id: string; name: string; date: string };

const POR_PAGINA = 8;
const chip = 'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap';
const btnPagina = 'min-h-10 px-4 rounded-xl border-[1.5px] border-pq-border bg-white text-sm font-semibold text-pq-teal-deep disabled:opacity-40';
const esEditable = (e: EstadoAsistencia): e is EstadoEditable => e !== 'PENDIENTE';

const rolTexto = (f: FilaAsistencia) =>
  f.rol === 'VOLUNTARIO' ? 'Voluntario externo' : [f.rol, f.area_voluntario].filter(Boolean).join(' · ');

const fechaJornada = (fecha: string) => new Date(fecha + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

export default function AsistenciasTH({ puedeEditar }: { puedeEditar: boolean }) {
  const [jornadas, setJornadas] = useState<JornadaOpt[]>([]);
  const [jornadaId, setJornadaId] = useState('');
  const [jornadasError, setJornadasError] = useState<string | null>(null);

  const [filas, setFilas] = useState<FilaAsistencia[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ultimaCarga, setUltimaCarga] = useState<Date | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [filtroPre, setFiltroPre] = useState('TODOS');
  const [pagina, setPagina] = useState(1);
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  useEffect(() => {
    cargarJornadas();
  }, []);

  const cargarJornadas = async () => {
    const { data, error } = await supabase
      .from('jornadas').select('id, name, date').order('date', { ascending: false }).limit(60);
    if (error) { setJornadasError(error.message); return; }
    setJornadasError(null);
    const lista = (data || []) as JornadaOpt[];
    setJornadas(lista);
    // Abre la jornada más reciente que ya empezó (hoy o antes); si no hay, la primera.
    const hoy = todayInLima();
    const inicial = lista.find(j => j.date <= hoy) ?? lista[0];
    if (inicial) setJornadaId(inicial.id);
  };

  const cargar = useCallback(async (id: string) => {
    setLoading(true);
    setLoadError(null);
    const res = await fetchAsistenciaJornada(id);
    if (res.error) setLoadError(res.error.message);
    else { setFilas(res.filas); setUltimaCarga(new Date()); }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!jornadaId) return;
    setSeleccionId(null);
    setPagina(1);
    cargar(jornadaId);
  }, [jornadaId, cargar]);

  const stats = useMemo(() => {
    const c: Record<EstadoAsistencia, number> =
      { ASISTIO: 0, TARDANZA: 0, FALTA_JUSTIFICADA: 0, FALTA_INJUSTIFICADA: 0, PENDIENTE: 0 };
    filas.forEach(f => { c[f.estado]++; });
    return c;
  }, [filas]);
  const total = filas.length;
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : '0%');

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return filas.filter(f => {
      if (filtroEstado !== 'TODOS' && f.estado !== filtroEstado) return false;
      if (filtroPre === 'SI' && !f.preregistro) return false;
      if (filtroPre === 'NO' && f.preregistro) return false;
      if (!q) return true;
      return nombreCompleto(f).toLowerCase().includes(q)
        || (f.correo ?? '').toLowerCase().includes(q)
        || (f.dni ?? '').includes(q);
    });
  }, [filas, busqueda, filtroEstado, filtroPre]);

  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const pag = Math.min(pagina, paginas);
  const visibles = filtradas.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);
  const seleccion = filas.find(f => f.voluntario_id === seleccionId) ?? null;
  const jornadaActual = jornadas.find(j => j.id === jornadaId);

  const exportar = () => {
    descargarCSV(`asistencia-${jornadaActual?.date ?? 'jornada'}.csv`, [
      ['Voluntario', 'Correo', 'DNI', 'Rol', 'Hora de llegada', 'Estado', 'Preregistro confirmado', 'Observaciones'],
      ...filas.map(f => [
        nombreCompleto(f), f.correo, f.dni, rolTexto(f), horaCorta(f.hora_llegada),
        ESTADO_INFO[f.estado].label, f.preregistro ? 'Sí' : 'No', f.observaciones,
      ]),
    ]);
  };

  const tarjetas: { estado: EstadoAsistencia; titulo: string }[] = [
    { estado: 'ASISTIO', titulo: 'Asistieron' },
    { estado: 'TARDANZA', titulo: 'Tardanzas' },
    { estado: 'FALTA_JUSTIFICADA', titulo: 'Justificadas' },
    { estado: 'FALTA_INJUSTIFICADA', titulo: 'Injustificadas' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {jornadasError && <LoadError message={jornadasError} onRetry={cargarJornadas} />}

      {/* JORNADA ACTIVA */}
      <section className="bg-white p-5 md:p-6 rounded-[20px] shadow-pq-card flex flex-wrap items-end gap-4">
        <div className="flex-[1_1_320px]">
          <label htmlFor="th-jornada" className={labelClass}>Jornada</label>
          <select id="th-jornada" value={jornadaId} onChange={e => setJornadaId(e.target.value)} className={`${inputClass} font-semibold text-pq-teal-deep`}>
            {jornadas.length === 0 && <option value="">No hay jornadas</option>}
            {jornadas.map(j => <option key={j.id} value={j.id}>{j.name} ({fechaJornada(j.date)})</option>)}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {ultimaCarga && (
            <span className="text-sm text-pq-ink-muted">
              Actualizado a las {ultimaCarga.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <BotonSecundario onClick={() => jornadaId && cargar(jornadaId)}>
            <RefreshCw size={16} aria-hidden="true" /> Actualizar
          </BotonSecundario>
          <BotonSecundario onClick={exportar} disabled={filas.length === 0}>
            <Download size={16} aria-hidden="true" /> Exportar reporte
          </BotonSecundario>
        </div>
      </section>

      {/* RESUMEN */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-[20px] shadow-pq-card p-4 flex flex-col gap-1">
          <p className="text-xs font-bold text-pq-ink-muted">Total en el padrón</p>
          <p className="font-display text-3xl font-extrabold text-pq-teal-deep">{total}</p>
          <p className="text-xs text-pq-ink-muted">{stats.PENDIENTE > 0 ? `${stats.PENDIENTE} pendientes` : 'Inscritos y asistentes'}</p>
        </div>
        {tarjetas.map(t => (
          <div key={t.estado} className="bg-white rounded-[20px] shadow-pq-card p-4 flex flex-col gap-1">
            <p className="text-xs font-bold text-pq-ink-muted">{t.titulo}</p>
            <p className="flex items-baseline gap-2">
              <span className="font-display text-3xl font-extrabold text-pq-teal-deep">{stats[t.estado]}</span>
              <span className={`${chip} ${ESTADO_INFO[t.estado].chip}`}>{pct(stats[t.estado])}</span>
            </p>
            <div className="h-1.5 rounded-full bg-pq-cream overflow-hidden mt-1" aria-hidden="true">
              <div className={`h-full rounded-full ${ESTADO_INFO[t.estado].barra}`} style={{ width: total ? `${(stats[t.estado] / total) * 100}%` : '0%' }} />
            </div>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
        {/* LISTA */}
        <section className="bg-white p-5 md:p-6 rounded-[20px] shadow-pq-card flex flex-col gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-pq-teal-deep">Asistencia de la jornada</h2>
            {jornadaActual && <p className="text-sm text-pq-ink-muted mt-0.5">{jornadaActual.name} · {fechaJornada(jornadaActual.date)}</p>}
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative flex-[1_1_220px]">
              <Search className="absolute left-4 top-3.5 text-pq-ink-muted" size={20} aria-hidden="true" />
              <label htmlFor="th-buscar" className="sr-only">Buscar</label>
              <input id="th-buscar" type="text" placeholder="Buscar voluntario..." value={busqueda}
                onChange={e => { setBusqueda(e.target.value); setPagina(1); }} className={`${inputClass} pl-12`} />
            </div>
            <label htmlFor="th-estado" className="sr-only">Filtrar por estado</label>
            <select id="th-estado" value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }} className={`${inputClass} flex-[1_1_160px] sm:flex-[0_1_190px]`}>
              <option value="TODOS">Todos los estados</option>
              {(Object.keys(ESTADO_INFO) as EstadoAsistencia[]).map(e => <option key={e} value={e}>{ESTADO_INFO[e].label}</option>)}
            </select>
            <label htmlFor="th-pre" className="sr-only">Filtrar por preregistro</label>
            <select id="th-pre" value={filtroPre} onChange={e => { setFiltroPre(e.target.value); setPagina(1); }} className={`${inputClass} flex-[1_1_160px] sm:flex-[0_1_190px]`}>
              <option value="TODOS">Preregistro: todos</option>
              <option value="SI">Con preregistro</option>
              <option value="NO">Sin preregistro</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center p-10"><p className="text-pq-teal-dark font-bold animate-pulse">Cargando asistencia...</p></div>
          ) : loadError ? (
            <LoadError message={loadError} onRetry={() => cargar(jornadaId)} />
          ) : visibles.length === 0 ? (
            <div className="text-center p-10 bg-pq-cream rounded-2xl border border-pq-cream-dark">
              <p className="text-pq-ink-muted">{filas.length === 0 ? 'Esta jornada aún no tiene inscritos ni asistencias.' : 'Ningún registro coincide con los filtros.'}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {visibles.map(f => {
                const activa = f.voluntario_id === seleccionId;
                const info = ESTADO_INFO[f.estado];
                const datos = [f.correo, f.dni && `DNI: ${f.dni}`, rolTexto(f)].filter(Boolean).join(' • ');
                return (
                  <button key={f.voluntario_id} type="button" aria-pressed={activa} onClick={() => setSeleccionId(f.voluntario_id)}
                    className={`w-full text-left rounded-2xl px-4 py-3.5 flex flex-wrap items-center gap-3 transition-colors ${
                      activa ? 'border-[1.5px] border-pq-teal bg-pq-teal-50/50' : 'border border-pq-cream-dark bg-white hover:bg-pq-cream/50'
                    }`}>
                    <span className="w-10 h-10 shrink-0 rounded-full bg-pq-teal-50 text-pq-teal-deep flex items-center justify-center text-sm font-bold">{iniciales(f)}</span>
                    <span className="flex-[3_1_180px] min-w-0 flex flex-col">
                      <span className="font-semibold text-pq-ink truncate">{nombreCompleto(f)}</span>
                      <span className="text-[13px] text-pq-ink-muted truncate">{datos}</span>
                    </span>
                    <span className={`${chip} ${f.hora_llegada ? 'bg-pq-teal-50 text-pq-teal-deep' : 'bg-pq-cream text-pq-ink-muted'}`}>
                      {f.hora_llegada
                        ? <><Check size={14} aria-hidden="true" /> {horaCorta(f.hora_llegada)} hrs</>
                        : <><X size={14} aria-hidden="true" /> No registró</>}
                    </span>
                    <span className={`${chip} ${info.chip}`}>{info.label}</span>
                    {puedeEditar && <Pencil size={16} className="text-pq-teal-dark" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}

          {!loading && !loadError && filtradas.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <span className="text-sm text-pq-ink-muted">Página {pag} de {paginas} • Mostrando {visibles.length} de {filtradas.length}</span>
              <div className="flex gap-2">
                <button type="button" disabled={pag <= 1} onClick={() => setPagina(pag - 1)} className={btnPagina}>Anterior</button>
                <button type="button" disabled={pag >= paginas} onClick={() => setPagina(pag + 1)} className={btnPagina}>Siguiente</button>
              </div>
            </div>
          )}
        </section>

        {/* PANEL DE EDICIÓN */}
        {seleccion ? (
          <PanelEdicion
            key={`${seleccion.voluntario_id}-${seleccion.actualizado_en ?? ''}`}
            jornadaId={jornadaId}
            fila={seleccion}
            puedeEditar={puedeEditar}
            onGuardado={() => cargar(jornadaId)}
            onCerrar={() => setSeleccionId(null)}
          />
        ) : (
          <section className="bg-white p-6 rounded-[20px] shadow-pq-card text-center">
            <p className="text-pq-ink-muted">Elige a una persona de la lista para ver su detalle{puedeEditar ? ' y corregir su asistencia' : ''}.</p>
          </section>
        )}
      </div>
    </div>
  );
}

function PanelEdicion({ jornadaId, fila, puedeEditar, onGuardado, onCerrar }: {
  jornadaId: string; fila: FilaAsistencia; puedeEditar: boolean; onGuardado: () => void; onCerrar: () => void;
}) {
  const [estado, setEstado] = useState<EstadoEditable>(esEditable(fila.estado) ? fila.estado : 'ASISTIO');
  const [hora, setHora] = useState(horaCorta(fila.hora_llegada));
  const [pre, setPre] = useState(fila.preregistro);
  const [obs, setObs] = useState(fila.observaciones ?? '');
  const [saving, setSaving] = useState(false);
  const [cambios, setCambios] = useState<CambioAsistencia[]>([]);
  const [histError, setHistError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    fetchHistorialAsistencia(jornadaId, fila.voluntario_id).then(({ cambios, error }) => {
      if (!activo) return;
      setCambios(cambios);
      setHistError(error ? error.message : null);
    });
    return () => { activo = false; };
  }, [jornadaId, fila.voluntario_id]);

  const conHora = estado === 'ASISTIO' || estado === 'TARDANZA';

  const guardar = async () => {
    setSaving(true);
    const { error } = await guardarRevision({
      jornadaId, voluntarioId: fila.voluntario_id, estado,
      hora: conHora ? hora : null, preregistro: pre, observaciones: obs,
    });
    setSaving(false);
    if (error) { toast.error('No se pudo guardar: ' + error.message); return; }
    toast.success('Asistencia actualizada.');
    onGuardado();
  };

  return (
    <section className="bg-white p-5 md:p-6 rounded-[20px] shadow-pq-card flex flex-col gap-5 xl:sticky xl:top-0">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-extrabold text-pq-teal-deep">{puedeEditar ? 'Edición de asistencia' : 'Detalle de asistencia'}</h2>
        <button type="button" onClick={onCerrar} aria-label="Cerrar panel" className="w-9 h-9 shrink-0 rounded-xl bg-pq-cream text-pq-teal-deep flex items-center justify-center">
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center gap-3 bg-pq-cream rounded-xl p-3">
        <span className="w-11 h-11 shrink-0 rounded-full bg-pq-teal text-white flex items-center justify-center font-bold">{iniciales(fila)}</span>
        <span className="min-w-0 flex flex-col">
          <span className="font-bold text-pq-ink truncate">{nombreCompleto(fila)}</span>
          <span className="text-xs text-pq-ink-muted truncate">{[fila.dni && `DNI: ${fila.dni}`, rolTexto(fila)].filter(Boolean).join(' • ')}</span>
        </span>
      </div>

      <div>
        <p className={labelClass}>Estado</p>
        <div className="grid grid-cols-2 gap-2">
          {ESTADOS_EDITABLES.map(e => (
            <button key={e} type="button" aria-pressed={estado === e} disabled={!puedeEditar} onClick={() => setEstado(e)}
              className={`min-h-11 px-3 py-2 rounded-xl border-[1.5px] text-sm font-semibold transition-colors disabled:cursor-default ${
                estado === e ? 'border-pq-teal bg-pq-teal-50 text-pq-teal-deep' : 'border-pq-border bg-white text-pq-ink/70 hover:bg-pq-cream'
              }`}>
              {ESTADO_INFO[e].label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="th-hora" className={labelClass}>Hora de llegada registrada</label>
        <input id="th-hora" type="time" value={conHora ? hora : ''} onChange={e => setHora(e.target.value)}
          disabled={!puedeEditar || !conHora} className={inputClass} />
        {!conHora && <p className="text-xs text-pq-ink-muted mt-1.5">Una falta no lleva hora de llegada.</p>}
      </div>

      <div className="flex items-center justify-between gap-3 bg-pq-cream rounded-xl p-3">
        <div>
          <p className="font-semibold text-pq-ink">Preregistro confirmado</p>
          <p className="text-xs text-pq-ink-muted">Confirmó su asistencia con anticipación</p>
        </div>
        <button type="button" role="switch" aria-checked={pre} aria-label="Preregistro confirmado" disabled={!puedeEditar} onClick={() => setPre(!pre)}
          className={`relative w-12 h-7 shrink-0 rounded-full transition-colors disabled:opacity-60 ${pre ? 'bg-pq-teal' : 'bg-pq-border'}`}>
          <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white transition-transform ${pre ? 'translate-x-5' : ''}`} />
        </button>
      </div>

      <div>
        <label htmlFor="th-obs" className={labelClass}>Observaciones de Talento Humano</label>
        <textarea id="th-obs" rows={3} value={obs} onChange={e => setObs(e.target.value)} disabled={!puedeEditar}
          placeholder="Anota acuerdos, motivos o lo que haya que recordar..." className={inputClass} />
      </div>

      <div>
        <p className={labelClass}>Historial de cambios <span className="font-normal text-pq-ink-muted">({cambios.length})</span></p>
        {histError ? (
          <p className="text-sm text-pq-error">No se pudo cargar el historial: {histError}</p>
        ) : cambios.length === 0 ? (
          <p className="text-sm text-pq-ink-muted">Todavía no se corrigió esta asistencia.</p>
        ) : (
          <ol className="flex flex-col gap-3 bg-pq-cream rounded-xl p-3 max-h-64 overflow-y-auto">
            {cambios.map(c => (
              <li key={c.id} className="flex gap-2.5">
                <span className="w-2 h-2 mt-1.5 shrink-0 rounded-full bg-pq-teal" aria-hidden="true" />
                <span className="text-sm text-pq-ink">
                  <span className="block text-xs text-pq-ink-muted">
                    {fechaHora(c.created_at)} · {c.editor ? nombreCompleto({ nombre: c.editor.first_name, apellido: c.editor.last_name }) : 'Alguien del equipo'}
                  </span>
                  {describirCambio(c)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {puedeEditar && (
        <div className="flex flex-wrap justify-end gap-3">
          <BotonSecundario onClick={onCerrar}>Cancelar</BotonSecundario>
          <BotonPrimario onClick={guardar} disabled={saving || (conHora && !hora)}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </BotonPrimario>
        </div>
      )}
    </section>
  );
}