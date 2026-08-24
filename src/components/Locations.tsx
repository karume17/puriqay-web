import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MapPin, Phone, User, Map, Info, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

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

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
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
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('locations').insert([formData]);

    if (error) {
      toast.error('Error al registrar el lugar: ' + error.message);
    } else {
      toast.success('¡Lugar registrado con éxito!');
      setFormData({
        name: '', action_line: 'Animalista', manager_name: '', contact_phone: '', 
        address: '', district: '', maps_link: '', meeting_point: '', special_instructions: '', status: 'ACTIVO'
      });
      fetchLocations();
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:bg-white focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none transition-all font-medium text-pq-ink";
  const labelClass = "block text-sm font-bold text-pq-teal-dark mb-2";

  // Ayudante para colores según la línea de acción
  const getActionLineColor = (line: string) => {
    switch (line) {
      case 'Animalista': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Ambiental': return 'bg-green-100 text-green-700 border-green-200';
      case 'Social': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Educativo': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Salud': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-pq-cream text-pq-teal-dark border-pq-cream-dark';
    }
  };

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
              <select name="action_line" value={formData.action_line} onChange={handleChange} className={inputClass}>
                <option value="Animalista">Animalista</option>
                <option value="Ambiental">Ambiental</option>
                <option value="Social">Social</option>
                <option value="Educativo">Educativo</option>
                <option value="Salud">Salud</option>
              </select>
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
              <input type="text" name="district" required value={formData.district} onChange={handleChange} className={inputClass} placeholder="Ej: San Martín de Porres" />
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
            {locations.map((loc) => (
              <div key={loc.id} className="border-2 border-pq-cream-dark rounded-2xl p-5 bg-white hover:border-pq-teal/40 hover:shadow-lg transition-all flex flex-col justify-between group">
                
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border flex items-center gap-1 ${getActionLineColor(loc.action_line)}`}>
                      <Activity size={12}/> {loc.action_line}
                    </span>
                    {loc.maps_link && (
                      <a href={loc.maps_link} target="_blank" rel="noreferrer" className="text-pq-teal-dark hover:text-pq-teal transition-colors" title="Ver en Maps">
                        <Map size={18} />
                      </a>
                    )}
                  </div>
                  
                  <h3 className="font-black text-xl text-pq-teal-deep mb-1 leading-tight group-hover:text-pq-teal transition-colors">{loc.name}</h3>
                  <p className="text-sm text-pq-ink/70 font-medium flex items-center gap-1.5 mb-4">
                    <MapPin size={14} className="text-pq-teal-dark/60 min-w-[14px]"/> {loc.district}
                  </p>

                  <div className="space-y-2 mb-4 bg-pq-cream/30 p-3 rounded-xl border border-pq-cream-dark/50">
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
                </div>

                {(loc.meeting_point || loc.special_instructions) && (
                  <div className="pt-3 border-t-2 border-dashed border-pq-cream-dark">
                    {loc.meeting_point && (
                      <p className="text-xs text-pq-ink/70 flex gap-1 mb-1.5">
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
              </div>
            ))}

            {locations.length === 0 && (
              <div className="col-span-full text-center p-10 bg-pq-cream/50 rounded-2xl border-2 border-dashed border-pq-cream-dark">
                <p className="text-pq-teal-dark font-medium">No tienes lugares aliados registrados aún.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}