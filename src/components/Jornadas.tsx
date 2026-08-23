import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Jornadas() {
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<any[]>([]); 
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    location_id: '',
    coordinator_id: '', 
    date: '',
    start_time: '',
    end_time: '',
    valid_hours: '',
    type: 'Jornada de Campo',
    description: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: locData } = await supabase
      .from('locations')
      .select('id, name, district')
      .eq('status', 'ACTIVO');
    if (locData) setLocations(locData);

    const { data: coordData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in('role', ['ADMIN', 'COORDINADOR']);
    if (coordData) setCoordinators(coordData);

    const { data: jorData } = await supabase
      .from('jornadas')
      .select('*, locations(name, district), profiles(first_name, last_name)')
      .order('date', { ascending: false });
      
    if (jorData) setJornadas(jorData);
    setFetching(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('jornadas')
      .insert([{
        name: formData.name,
        location_id: formData.location_id,
        coordinator_id: formData.coordinator_id, 
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        valid_hours: parseFloat(formData.valid_hours),
        type: formData.type,
        description: formData.description
      }]);

    if (error) {
      alert('Error al crear la jornada: ' + error.message);
    } else {
      alert('¡Jornada programada con éxito!');
      setFormData({
        ...formData, name: '', location_id: '', coordinator_id: '', date: '', start_time: '', end_time: '', valid_hours: '', description: ''
      });
      fetchData();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* FORMULARIO DE CREACIÓN */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Programar Nueva Jornada</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de la Jornada <span className="text-red-500">*</span></label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="Ej: Limpieza de Verano" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lugar del Voluntariado <span className="text-red-500">*</span></label>
              <select name="location_id" required value={formData.location_id} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white">
                <option value="">-- Selecciona un Lugar Aliado --</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.name} ({loc.district})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Responsable (Interno) <span className="text-red-500">*</span></label>
              <select name="coordinator_id" required value={formData.coordinator_id} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white">
                <option value="">-- Selecciona Responsable --</option>
                {coordinators.map(coord => (
                  <option key={coord.id} value={coord.id}>{coord.first_name} {coord.last_name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha <span className="text-red-500">*</span></label>
              <input type="date" name="date" required value={formData.date} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Inicio <span className="text-red-500">*</span></label>
              <input type="time" name="start_time" required value={formData.start_time} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hora Fin <span className="text-red-500">*</span></label>
              <input type="time" name="end_time" required value={formData.end_time} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Horas Válidas <span className="text-red-500">*</span></label>
              <input type="number" step="0.5" name="valid_hours" required value={formData.valid_hours} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="Ej: 3" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Actividad <span className="text-red-500">*</span></label>
              <select name="type" required value={formData.type} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none bg-white">
                <option value="Jornada de Campo">Jornada de Campo</option>
                <option value="Jornada Educativa">Jornada Educativa</option>
                <option value="Reunión Virtual">Reunión Virtual</option>
                <option value="Capacitación">Capacitación</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción de Actividades <span className="text-red-500">*</span></label>
              <textarea name="description" required value={formData.description} onChange={handleChange} rows={1} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="¿Qué se hará exactamente?"></textarea>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" disabled={loading || locations.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition duration-200">
              {loading ? 'Guardando...' : 'Crear Jornada'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA DE JORNADAS */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Jornadas Programadas</h2>
        {fetching ? (
          <p className="text-gray-500">Cargando jornadas...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-3 border-b rounded-tl-lg">Fecha</th>
                  <th className="p-3 border-b">Jornada</th>
                  <th className="p-3 border-b">Lugar</th>
                  <th className="p-3 border-b">Responsable</th>
                  <th className="p-3 border-b">Horario</th>
                  <th className="p-3 border-b rounded-tr-lg">Hrs</th>
                </tr>
              </thead>
              <tbody>
                {jornadas.map((jor) => (
                  <tr key={jor.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 border-b font-medium text-blue-600">
                      {/* MÉTODO INFALIBLE: Cortamos YYYY-MM-DD y lo invertimos a DD/MM/YYYY */}
                      {jor.date.split('-').reverse().join('/')}
                    </td>
                    <td className="p-3 border-b font-medium text-gray-800">{jor.name}</td>
                    <td className="p-3 border-b text-gray-600">{jor.locations?.name} <span className="text-xs text-gray-400">({jor.locations?.district})</span></td>
                    <td className="p-3 border-b font-medium text-gray-800">
                      {jor.profiles ? `${jor.profiles.first_name} ${jor.profiles.last_name}` : 'Sin asignar'}
                    </td>
                    <td className="p-3 border-b text-gray-600">{jor.start_time.slice(0,5)} - {jor.end_time.slice(0,5)}</td>
                    <td className="p-3 border-b text-gray-600 font-bold">{jor.valid_hours}</td>
                  </tr>
                ))}
                {jornadas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-gray-500">Aún no hay jornadas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}