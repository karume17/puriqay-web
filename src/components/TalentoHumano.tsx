import { useCallback, useEffect, useState } from 'react';
import { ListChecks, ShieldAlert, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EncabezadoPagina, BotonPrimario } from './JornadaUI';
import AsistenciasTH from './AsistenciasTH';
import IncidenciasTH from './IncidenciasTH';
import NuevaIncidenciaModal from './NuevaIncidenciaModal';

type Sub = 'asistencias' | 'incidencias';

// `puedeEditar` = corregir asistencias (solo ADMIN); registrar y gestionar incidencias
// lo puede todo el que ve el módulo. La base aplica las mismas reglas: esto solo decide
// qué botones mostrar.
export default function TalentoHumano({ puedeEditar, veDatosPersonales }: {
  puedeEditar: boolean; veDatosPersonales: boolean;
}) {
  const [sub, setSub] = useState<Sub>('asistencias');
  const [nueva, setNueva] = useState(false);
  const [version, setVersion] = useState(0);
  const [pendientes, setPendientes] = useState(0);

  const contarPendientes = useCallback(async () => {
    const { count } = await supabase
      .from('incidencias').select('id', { count: 'exact', head: true }).eq('estado', 'PENDIENTE');
    setPendientes(count ?? 0);
  }, []);

  useEffect(() => { contarPendientes(); }, [contarPendientes, version]);

  const tab = (id: Sub) =>
    `inline-flex items-center gap-2 min-h-11 px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
      sub === id ? 'bg-pq-teal text-white shadow-md shadow-pq-teal/30' : 'bg-pq-cream text-pq-teal-deep hover:bg-pq-cream-dark'
    }`;

  return (
    <div className="flex flex-col gap-6 md:gap-7">
      <EncabezadoPagina
        titulo="Talento Humano"
        descripcion="Control de asistencias por jornada, seguimiento de voluntarios e incidencias."
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Secciones de Talento Humano">
          <button type="button" role="tab" aria-selected={sub === 'asistencias'} onClick={() => setSub('asistencias')} className={tab('asistencias')}>
            <ListChecks size={18} aria-hidden="true" /> Control de asistencias
          </button>
          <button type="button" role="tab" aria-selected={sub === 'incidencias'} onClick={() => setSub('incidencias')} className={tab('incidencias')}>
            <ShieldAlert size={18} aria-hidden="true" /> Incidencias
            {pendientes > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-pq-error-50 text-pq-error text-xs font-bold">{pendientes} pendientes</span>
            )}
          </button>
        </div>
        <BotonPrimario onClick={() => setNueva(true)}>
          <Plus size={16} aria-hidden="true" /> Registrar incidencia
        </BotonPrimario>
      </div>

      {sub === 'asistencias' && <AsistenciasTH puedeEditar={puedeEditar} />}
      {sub === 'incidencias' && <IncidenciasTH version={version} puedeGestionar onCambio={contarPendientes} />}

      {nueva && (
        <NuevaIncidenciaModal
          veDatosPersonales={veDatosPersonales}
          onCerrar={() => setNueva(false)}
          onGuardada={() => { setNueva(false); setSub('incidencias'); setVersion(v => v + 1); }}
        />
      )}
    </div>
  );
}