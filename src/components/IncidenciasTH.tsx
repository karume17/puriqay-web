import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Search, TriangleAlert, ChevronRight, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Nombre } from '../lib/permisos';
import LoadError from './LoadError';
import { BotonPrimario, BotonSecundario, inputClass, labelClass } from './JornadaUI';
import {
  TIPOS_INCIDENCIA, SEVERIDADES, SEVERIDAD_CHIP, ESTADOS_INCIDENCIA, ESTADO_INCIDENCIA_CHIP, ACCION_BITACORA,
  fetchIncidencias, fetchBitacora, nombreCompleto, iniciales, fechaHora, descargarCSV,
  type Incidencia, type EstadoIncidencia, type EntradaBitacora,
} from '../lib/talentoHumano.ts';

const chip = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap';

const nombreDe = (n: Nombre | undefined) => nombreCompleto({ nombre: n?.first_name, apellido: n?.last_name });

// `version` sube cuando se registra una incidencia nueva (desde el botón de la cabecera)
// y la lista se vuelve a pedir. `onCambio` avisa para refrescar el contador de pendientes.
export default function IncidenciasTH({ version, puedeGestionar, onCambio }: {
  version: number; puedeGestionar: boolean; onCambio: () => void;
}) {
  const [items, setItems] = useState<Incidencia[]>([]);
  const [nombres, setNombres] = useState<Record<string, Nombre>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [seleccionId, setSeleccionId] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const res = await fetchIncidencias();
    if (res.error) setLoadError(res.error.message);
    else {
      setItems(res.items);
      setNombres(res.nombres);
      setSeleccionId(prev => (prev && res.items.some(i => i.id === prev) ? prev : res.items[0]?.id ?? null));
    }
    setLoading(false);
  }, []);

  useEffect(() => { cargar(); }, [cargar, version]);

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return items;
    return items.filter(i =>
      nombreDe(nombres[i.volunteer_id]).toLowerCase().includes(q) || TIPOS_INCIDENCIA[i.tipo].toLowerCase().includes(q));
  }, [items, nombres, busqueda]);

  const seleccion = items.find(i => i.id === seleccionId) ?? null;

  const exportar = () => {
    descargarCSV('incidencias.csv', [
      ['Fecha', 'Voluntario', 'Tipo', 'Severidad', 'Estado', 'Detalle'],
      ...items.map(i => [
        fechaHora(i.ocurrio_en), nombreDe(nombres[i.volunteer_id]), TIPOS_INCIDENCIA[i.tipo],
        SEVERIDADES[i.severidad], ESTADOS_INCIDENCIA[i.estado], i.detalle,
      ]),
    ]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
      {/* BITÁCORA */}
      <section className="bg-white p-5 md:p-6 rounded-[20px] shadow-pq-card flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-extrabold text-pq-teal-deep">Bitácora de incidencias operativas</h2>
            <p className="text-sm text-pq-ink-muted mt-0.5">Seguimiento de contingencias, permisos médicos y resoluciones.</p>
          </div>
          <BotonSecundario onClick={exportar} disabled={items.length === 0}>
            <Download size={16} aria-hidden="true" /> Exportar
          </BotonSecundario>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-[1_1_240px]">
            <Search className="absolute left-4 top-3.5 text-pq-ink-muted" size={20} aria-hidden="true" />
            <label htmlFor="th-inc-buscar" className="sr-only">Buscar incidencia</label>
            <input id="th-inc-buscar" type="text" placeholder="Buscar por voluntario o tipo..." value={busqueda}
              onChange={e => setBusqueda(e.target.value)} className={`${inputClass} pl-12`} />
          </div>
          <span className={`${chip} bg-pq-cream text-pq-teal-deep`}>{items.length} registradas</span>
        </div>

        {loading ? (
          <div className="flex justify-center p-10"><p className="text-pq-teal-dark font-bold animate-pulse">Cargando incidencias...</p></div>
        ) : loadError ? (
          <LoadError message={loadError} onRetry={cargar} />
        ) : filtradas.length === 0 ? (
          <div className="text-center p-10 bg-pq-cream rounded-2xl border border-pq-cream-dark">
            <p className="text-pq-ink-muted">{items.length === 0 ? 'Aún no hay incidencias. Usa "Registrar incidencia" para crear la primera.' : 'Ninguna incidencia coincide con la búsqueda.'}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {filtradas.map(i => {
              const activa = i.id === seleccionId;
              const entradas = i.incidencias_bitacora?.[0]?.count ?? 0;
              return (
                <button key={i.id} type="button" aria-pressed={activa} onClick={() => setSeleccionId(i.id)}
                  className={`w-full text-left rounded-2xl p-4 flex gap-3 transition-colors ${
                    activa ? 'border-[1.5px] border-pq-teal bg-pq-teal-50/50' : 'border border-pq-cream-dark bg-white hover:bg-pq-cream/50'
                  }`}>
                  <span className="w-10 h-10 shrink-0 rounded-full bg-pq-error-50 text-pq-error flex items-center justify-center">
                    <TriangleAlert size={18} aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-pq-ink">{nombreDe(nombres[i.volunteer_id])}</span>
                      <span className={`${chip} ${SEVERIDAD_CHIP[i.severidad]}`}>Severidad {SEVERIDADES[i.severidad].toLowerCase()}</span>
                      <span className={`${chip} ${ESTADO_INCIDENCIA_CHIP[i.estado]}`}>{ESTADOS_INCIDENCIA[i.estado]}</span>
                    </span>
                    <span className="text-sm font-semibold text-pq-teal-deep">{TIPOS_INCIDENCIA[i.tipo]}</span>
                    <span className="text-sm text-pq-ink/80 line-clamp-2">{i.detalle}</span>
                    <span className="text-xs text-pq-ink-muted">{fechaHora(i.ocurrio_en)} · {entradas} {entradas === 1 ? 'entrada' : 'entradas'} de bitácora</span>
                  </span>
                  <span className="self-center inline-flex items-center gap-0.5 text-sm font-semibold text-pq-teal">
                    Gestionar <ChevronRight size={16} aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* DETALLE */}
      {seleccion ? (
        <DetalleIncidencia
          key={`${seleccion.id}-${seleccion.estado}-${seleccion.incidencias_bitacora?.[0]?.count ?? 0}`}
          incidencia={seleccion}
          nombre={nombres[seleccion.volunteer_id]}
          puedeGestionar={puedeGestionar}
          onActualizada={() => { cargar(); onCambio(); }}
        />
      ) : (
        <section className="bg-white p-6 rounded-[20px] shadow-pq-card text-center">
          <p className="text-pq-ink-muted">Elige una incidencia para ver su detalle y su historial.</p>
        </section>
      )}
    </div>
  );
}

function DetalleIncidencia({ incidencia, nombre, puedeGestionar, onActualizada }: {
  incidencia: Incidencia; nombre: Nombre | undefined; puedeGestionar: boolean; onActualizada: () => void;
}) {
  const [estado, setEstado] = useState<EstadoIncidencia>(incidencia.estado);
  const [nota, setNota] = useState('');
  const [saving, setSaving] = useState(false);
  const [entradas, setEntradas] = useState<EntradaBitacora[]>([]);
  const [bitError, setBitError] = useState<string | null>(null);

  useEffect(() => {
    let activo = true;
    fetchBitacora(incidencia.id).then(({ entradas, error }) => {
      if (!activo) return;
      setEntradas(entradas);
      setBitError(error ? error.message : null);
    });
    return () => { activo = false; };
  }, [incidencia.id]);

  const guardar = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('actualizar_incidencia', {
      p_incidencia: incidencia.id, p_estado: estado, p_detalle: nota,
    });
    setSaving(false);
    if (error) { toast.error('No se pudo actualizar: ' + error.message); return; }
    toast.success('Incidencia actualizada.');
    onActualizada();
  };

  return (
    <section className="bg-white p-5 md:p-6 rounded-[20px] shadow-pq-card flex flex-col gap-5 xl:sticky xl:top-0">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-extrabold text-pq-teal-deep">Detalle de incidencia</h2>
        <span className={`${chip} ${ESTADO_INCIDENCIA_CHIP[incidencia.estado]}`}>{ESTADOS_INCIDENCIA[incidencia.estado]}</span>
      </div>

      <div className="flex items-center gap-3 bg-pq-cream rounded-xl p-3">
        <span className="w-11 h-11 shrink-0 rounded-full bg-pq-error-50 text-pq-error flex items-center justify-center font-bold">
          {iniciales({ nombre: nombre?.first_name, apellido: nombre?.last_name })}
        </span>
        <span className="min-w-0 flex flex-col">
          <span className="font-bold text-pq-ink truncate">{nombreDe(nombre)}</span>
          <span className="text-xs text-pq-ink-muted">
            {TIPOS_INCIDENCIA[incidencia.tipo]} · Severidad {SEVERIDADES[incidencia.severidad].toLowerCase()}
          </span>
          <span className="text-xs text-pq-ink-muted">{fechaHora(incidencia.ocurrio_en)}</span>
        </span>
      </div>

      <p className="text-sm text-pq-ink bg-pq-cream rounded-xl p-3">{incidencia.detalle}</p>

      {puedeGestionar && (
        <>
          <div>
            <p className={labelClass}>Estado de resolución</p>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ESTADOS_INCIDENCIA) as EstadoIncidencia[]).map(e => (
                <button key={e} type="button" aria-pressed={estado === e} onClick={() => setEstado(e)}
                  className={`min-h-11 px-2 py-2 rounded-xl border-[1.5px] text-sm font-semibold transition-colors ${
                    estado === e ? 'border-pq-teal bg-pq-teal-50 text-pq-teal-deep' : 'border-pq-border bg-white text-pq-ink/70 hover:bg-pq-cream'
                  }`}>
                  {ESTADOS_INCIDENCIA[e]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="th-inc-nota" className={labelClass}>Acción o justificación de Talento Humano *</label>
            <textarea id="th-inc-nota" rows={3} value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Describe qué se hizo o por qué cambia el estado..." className={inputClass} />
          </div>

          <BotonPrimario onClick={guardar} disabled={saving || nota.trim() === ''}>
            {saving ? 'Guardando...' : 'Actualizar incidencia'}
          </BotonPrimario>
        </>
      )}

      <div>
        <p className={labelClass}>Historial de gestión <span className="font-normal text-pq-ink-muted">({entradas.length})</span></p>
        {bitError ? (
          <p className="text-sm text-pq-error">No se pudo cargar el historial: {bitError}</p>
        ) : (
          <ol className="flex flex-col gap-3 bg-pq-cream rounded-xl p-3 max-h-72 overflow-y-auto">
            {entradas.map(e => (
              <li key={e.id} className="flex gap-2.5">
                <span className="w-2 h-2 mt-1.5 shrink-0 rounded-full bg-pq-error" aria-hidden="true" />
                <span className="text-sm text-pq-ink">
                  <span className="block text-xs text-pq-ink-muted">
                    {fechaHora(e.created_at)} · {e.autor ? nombreDe(e.autor) : 'Alguien del equipo'} · {ACCION_BITACORA[e.accion]}
                  </span>
                  {e.accion === 'CAMBIO_ESTADO' && e.estado_antes && e.estado_despues && (
                    <span className="block font-semibold">{ESTADOS_INCIDENCIA[e.estado_antes]} → {ESTADOS_INCIDENCIA[e.estado_despues]}</span>
                  )}
                  {e.detalle}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}