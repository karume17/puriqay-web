import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Modal, BotonPrimario, BotonSecundario, inputClass, labelClass } from './JornadaUI';
import {
  TIPOS_INCIDENCIA, SEVERIDADES, type TipoIncidencia, type Severidad,
} from '../lib/talentoHumano.ts';

type Persona = { id: string; first_name: string | null; last_name: string | null; document_id?: string | null };

export default function NuevaIncidenciaModal({ veDatosPersonales, onCerrar, onGuardada }: {
  veDatosPersonales: boolean; onCerrar: () => void; onGuardada: () => void;
}) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [cargando, setCargando] = useState(true);
  const [voluntario, setVoluntario] = useState('');
  const [tipo, setTipo] = useState<TipoIncidencia>('TARDANZA_OPERATIVA');
  const [severidad, setSeveridad] = useState<Severidad>('MEDIA');
  const [detalle, setDetalle] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      // Mismo criterio que Voluntarios: el DNI solo lo ve quien puede ver datos personales;
      // el resto elige por nombre desde la vista perfiles_basicos.
      const { data, error } = veDatosPersonales
        ? await supabase.from('profiles').select('id, first_name, last_name, document_id').order('last_name')
        : await supabase.from('perfiles_basicos').select('id, first_name, last_name').order('last_name');
      if (error) toast.error('No se pudo cargar la lista de personas: ' + error.message);
      else setPersonas((data || []) as Persona[]);
      setCargando(false);
    })();
  }, [veDatosPersonales]);

  const guardar = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('registrar_incidencia', {
      p_voluntario: voluntario, p_tipo: tipo, p_severidad: severidad, p_detalle: detalle,
    });
    setSaving(false);
    if (error) { toast.error('No se pudo guardar: ' + error.message); return; }
    toast.success('Incidencia registrada.');
    onGuardada();
  };

  return (
    <Modal
      titulo="Registrar nueva incidencia"
      descripcion="Queda en la bitácora con tu nombre y la fecha."
      onCerrar={onCerrar}
      pie={<>
        <BotonSecundario onClick={onCerrar}>Cancelar</BotonSecundario>
        <BotonPrimario onClick={guardar} disabled={saving || !voluntario || detalle.trim() === ''}>
          {saving ? 'Guardando...' : 'Guardar incidencia'}
        </BotonPrimario>
      </>}
    >
      <div className="flex flex-col gap-5">
        <div>
          <label htmlFor="inc-voluntario" className={labelClass}>Voluntario involucrado *</label>
          <select id="inc-voluntario" value={voluntario} onChange={e => setVoluntario(e.target.value)} disabled={cargando} className={inputClass}>
            <option value="">{cargando ? 'Cargando...' : 'Elige a una persona'}</option>
            {personas.map(p => (
              <option key={p.id} value={p.id}>
                {[p.first_name, p.last_name].filter(Boolean).join(' ') || 'Sin nombre'}{p.document_id ? ` (DNI: ${p.document_id})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-[1_1_220px]">
            <label htmlFor="inc-tipo" className={labelClass}>Tipo de incidencia *</label>
            <select id="inc-tipo" value={tipo} onChange={e => setTipo(e.target.value as TipoIncidencia)} className={inputClass}>
              {(Object.keys(TIPOS_INCIDENCIA) as TipoIncidencia[]).map(t => <option key={t} value={t}>{TIPOS_INCIDENCIA[t]}</option>)}
            </select>
          </div>
          <div className="flex-[1_1_160px]">
            <label htmlFor="inc-severidad" className={labelClass}>Severidad *</label>
            <select id="inc-severidad" value={severidad} onChange={e => setSeveridad(e.target.value as Severidad)} className={inputClass}>
              {(Object.keys(SEVERIDADES) as Severidad[]).map(s => <option key={s} value={s}>{SEVERIDADES[s]}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="inc-detalle" className={labelClass}>Detalle o justificación *</label>
          <textarea id="inc-detalle" rows={4} value={detalle} onChange={e => setDetalle(e.target.value)}
            placeholder="Describe brevemente la causa, los acuerdos o el sustento entregado por la persona..." className={inputClass} />
        </div>
      </div>
    </Modal>
  );
}