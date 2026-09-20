import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Phone, User, Map, Info, Activity, ChevronDown, ChevronUp, Pencil, Home } from 'lucide-react';
import toast from 'react-hot-toast';
import { DISTRITOS_LIMA, DISTRITOS_CALLAO, ACTION_LINES, getActionLineColor } from '../lib/catalogs';

type Location = {
  id: string;
  name: string;
  action_line: string;
  district: string;
  address: string;
  manager_name: string;
  contact_phone: string;
  maps_link: string;
  meeting_point: string;
  special_instructions: string;
  status: string;
};

const emptyForm = {
  name: '',
  action_line: 'Animalista',
  manager_name: '',
  contact_phone: '',
  address: '',
  district: '',
  maps_link: '',
  meeting_point: '',
  special_instructions: '',
  status: 'ACTIVO'
};

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState(emptyForm);

  // Tarjetas minimalistas: la dirección, el punto de encuentro y las indicaciones
  // especiales quedan ocultas hasta que se hace clic en "Ver detalles".
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Edición de un lugar ya registrado (la directora puede corregir los datos).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setLocations(data);
    }
    setFetching(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const openEdit = (loc: Location) => {
    setEditingId(loc.id);
    setEditForm({
      name: loc.name || '',
      action_line: loc.action_line || 'Animalista',
      manager_name: loc.manager_name || '',
      contact_phone: loc.contact_phone || '',
      address: loc.address || '',
      district: loc.district || '',
      maps_link: loc.maps_link || '',
      meeting_point: loc.meeting_point || '',
      special_instructions: loc.special_instructions || '',
      status: loc.status || 'ACTIVO',
    });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEdit(true);

    const { data, error } = await supabase
      .from('locations')
      .update(editForm)
      .eq('id', editingId)
      .select('id'); // .select() nos devuelve las filas realmente afectadas

    if (error) {
      toast.error('Error al actualizar el lugar: ' + error.message);
    } else if (!data || data.length === 0) {
      // Si RLS bloquea el UPDATE, PostgREST responde OK con 0 filas y sin error.
      toast.error('No se pudo actualizar: la base de datos no modificó ninguna fila. Revisa las políticas RLS de la tabla locations en Supabase.');
    } else {
      toast.success('¡Lugar actualizado!');
      setEditingId(null);
      fetchLocations();
    }
    setSavingEdit(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('locations').insert([formData]);

    if (error) {
      toast.error('Error al registrar el lugar: ' + error.message);
    } else {
      toast.success('¡Lugar registrado con éxito!');
      setFormData(emptyForm);
      fetchLocations();
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:bg-white focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none transition-all font-medium text-pq-ink";
  const labelClass = "block text-sm font-bold text-pq-teal-dark mb-2";

  // Selector de distrito reutilizado por el formulario de alta y el de edición.
  const DistrictSelect = ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
    <select name="district" required value={value} onChange={onChange} className={inputClass}>
      <option value="">-- Selecciona un distrito --</option>
      <optgroup label="Lima Metropolitana">
        {DISTRITOS_LIMA.map(d => <option key={d} value={d}>{d}</option>)}
      </optgroup>
      <optgroup label="Callao">
        {DISTRITOS_CALLAO.map(d => <option key={d} value={d}>{d}</option>)}
      </optgroup>
    </select>
  );

  const ActionLineSelect = ({ value, onChange }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }) => (
    <select name="action_line" required value={value} onChange={onChange} className={inputClass}>
      {ACTION_LINES.map(l => <option key={l} value={l}>{l}</option>)}
    </select>
  );

  return (
    <div className="space-y-8">

      {/* FORMULARIO DE CREACIÓN */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-pq-cream-dark shadow-sm">
        <h2 className="text-2xl font-black text-pq-teal-deep mb-6 flex items-center gap-2">
          Registrar Nuevo Lugar / Aliado <span className="w-2 h-2 rounded-full bg-pq-marku inline-block"></span>
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Nombre del Lugar / Organización <span className="text-red-500">*</span></label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className={inputClass} placeholder="Ej: Albergue 4 Patas" />
            </div>
            <div>
              <label className={labelClass}>Línea de Acción <span className="text-red-500">*</span></label>
              <ActionLineSelect value={formData.action_line} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Encargado(a)</label>
              <input type="text" name="manager_name" value={formData.manager_name} onChange={handleChange} className={inputClass} placeholder="Nombre del contacto principal" />
            </div>
            <div>
              <label className={labelClass}>Teléfono de Contacto</label>
              <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className={inputClass} placeholder="Ej: 999888777" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className={labelClass}>Dirección Exacta <span className="text-red-500">*</span></label>
              <input type="text" name="address" required value={formData.address} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Distrito <span className="text-red-500">*</span></label>
              <DistrictSelect value={formData.district} onChange={handleChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Punto de Encuentro</label>
              <input type="text" name="meeting_point" value={formData.meeting_point} onChange={handleChange} className={inputClass} placeholder="Ej: Puerta principal / Estación de tren" />
            </div>
            <div>
              <label className={labelClass}>Link de Google Maps</label>
              <input type="url" name="maps_link" value={formData.maps_link} onChange={handleChange} className={inputClass} placeholder="https://maps.app.goo.gl/..." />
            </div>
          </div>

          <div>
            <label className={labelClass}>Indicaciones Especiales</label>
            <textarea name="special_instructions" value={formData.special_instructions} onChange={handleChange} rows={2} className={`${inputClass} resize-none`} placeholder="Ej: Llevar botas de agua, tocar timbre rojo..."></textarea>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t-2 border-dashed border-pq-cream-dark">
            <button type="submit" disabled={loading} className="bg-pq-teal hover:bg-pq-teal-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-pq-teal/30 hover:-translate-y-0.5 transition-all duration-200">
              {loading ? 'Guardando...' : 'Guardar Lugar'}
            </button>
          </div>
        </form>
      </div>

      {/* DIRECTORIO DE LUGARES */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-pq-cream-dark shadow-sm">
        <h2 className="text-2xl font-black text-pq-teal-deep mb-6 flex items-center gap-2">
          Directorio de Lugares Aliados <span className="w-2 h-2 rounded-full bg-pq-marku inline-block"></span>
        </h2>

        {fetching ? (
          <div className="flex justify-center p-10"><p className="text-pq-teal-dark font-bold animate-pulse">Cargando directorio...</p></div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {locations.map((loc) => {
              const isExpanded = expandedId === loc.id;

              return (
                <div key={loc.id} className={`border-2 rounded-2xl p-5 bg-white transition-all flex flex-col group ${
                  isExpanded ? 'border-pq-teal shadow-lg' : 'border-pq-cream-dark hover:border-pq-teal/40 hover:shadow-lg'
                }`}>

                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1 ${getActionLineColor(loc.action_line)}`}>
                      <Activity size={12}/> {loc.action_line}
                    </span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openEdit(loc)} title="Editar lugar" className="text-pq-teal-dark hover:text-pq-teal transition-colors">
                        <Pencil size={16} />
                      </button>
                      {loc.maps_link && (
                        <a href={loc.maps_link} target="_blank" rel="noreferrer" className="text-pq-teal-dark hover:text-pq-teal transition-colors" title="Ver en Maps">
                          <Map size={18} />
                        </a>
                      )}
                    </div>
                  </div>

                  <h3 className="font-black text-xl text-pq-teal-deep mb-1 leading-tight group-hover:text-pq-teal transition-colors">{loc.name}</h3>
                  <p className="text-sm text-pq-ink/70 font-medium flex items-center gap-1.5 mb-4">
                    <MapPin size={14} className="text-pq-teal-dark/60 min-w-[14px]"/> {loc.district}
                  </p>

                  <div className="space-y-2 bg-pq-cream/30 p-3 rounded-xl border border-pq-cream-dark/50">
                    <div className="flex items-center gap-2 text-sm text-pq-ink/80">
                      <User size={14} className="text-pq-teal-dark"/>
                      <span className="font-bold">{loc.manager_name || 'Sin encargado'}</span>
                    </div>
                    {loc.contact_phone && (
                      <div className="flex items-center gap-2 text-sm text-pq-ink/80">
                        <Phone size={14} className="text-pq-teal-dark"/>
                        <span className="font-medium">{loc.contact_phone}</span>
                      </div>
                    )}
                  </div>

                  {/* DETALLES COLAPSABLES: dirección, punto de encuentro e indicaciones */}
                  {(loc.address || loc.meeting_point || loc.special_instructions) && (
                    <>
                      <button
                        type="button"
                        onClick={() => toggleExpand(loc.id)}
                        className="w-full flex items-center justify-between mt-3 pt-3 border-t-2 border-dashed border-pq-cream-dark text-xs font-black text-pq-teal-dark uppercase tracking-wider hover:text-pq-teal transition-colors"
                      >
                        {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-2">
                          {loc.address && (
                            <p className="text-xs text-pq-ink/70 flex gap-1.5 items-start">
                              <Home size={12} className="text-pq-teal-dark mt-0.5 min-w-[12px]"/>
                              <span>{loc.address}</span>
                            </p>
                          )}
                          {loc.meeting_point && (
                            <p className="text-xs text-pq-ink/70 flex gap-1">
                              <span className="font-bold text-pq-teal-dark min-w-[50px]">Punto:</span> {loc.meeting_point}
                            </p>
                          )}
                          {loc.special_instructions && (
                            <p className="text-xs text-pq-ink/70 flex gap-1 items-start">
                              <Info size={12} className="text-pq-marku mt-0.5 min-w-[12px]"/>
                              <span className="italic">{loc.special_instructions}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

            {locations.length === 0 && (
              <div className="col-span-full text-center p-10 bg-pq-cream/50 rounded-2xl border-2 border-dashed border-pq-cream-dark">
                <p className="text-pq-teal-dark font-medium">No tienes lugares aliados registrados aún.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL DE EDICIÓN DE LUGAR */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pq-ink/60 backdrop-blur-sm px-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 border border-pq-cream-dark my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-black text-pq-teal-deep mb-6 flex items-center gap-2">
              Editar Lugar <span className="w-2 h-2 rounded-full bg-pq-marku inline-block"></span>
            </h3>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClass}>Nombre del Lugar / Organización <span className="text-red-500">*</span></label>
                  <input type="text" name="name" required value={editForm.name} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Línea de Acción <span className="text-red-500">*</span></label>
                  <ActionLineSelect value={editForm.action_line} onChange={handleEditChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Encargado(a)</label>
                  <input type="text" name="manager_name" value={editForm.manager_name} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono de Contacto</label>
                  <input type="text" name="contact_phone" value={editForm.contact_phone} onChange={handleEditChange} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <label className={labelClass}>Dirección Exacta <span className="text-red-500">*</span></label>
                  <input type="text" name="address" required value={editForm.address} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Distrito <span className="text-red-500">*</span></label>
                  <DistrictSelect value={editForm.district} onChange={handleEditChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>Punto de Encuentro</label>
                  <input type="text" name="meeting_point" value={editForm.meeting_point} onChange={handleEditChange} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Link de Google Maps</label>
                  <input type="url" name="maps_link" value={editForm.maps_link} onChange={handleEditChange} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Indicaciones Especiales</label>
                <textarea name="special_instructions" value={editForm.special_instructions} onChange={handleEditChange} rows={3} className={`${inputClass} resize-none`}></textarea>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t-2 border-dashed border-pq-cream-dark">
                <button type="button" onClick={() => setEditingId(null)} className="px-5 py-2.5 text-pq-ink/70 font-bold hover:bg-pq-cream rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={savingEdit} className="px-5 py-2.5 bg-pq-teal text-white font-bold rounded-xl hover:bg-pq-teal-dark shadow-lg shadow-pq-teal/30 transition-all">
                  {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
