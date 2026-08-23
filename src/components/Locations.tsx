import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Location = {
  id: string;
  name: string;
  action_line: string;
  district: string;
  manager_name: string;
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
      alert('Error al registrar el lugar: ' + error.message);
    } else {
      alert('¡Lugar registrado con éxito!');
      setFormData({
        name: '', action_line: 'Animalista', manager_name: '', contact_phone: '', 
        address: '', district: '', maps_link: '', meeting_point: '', special_instructions: '', status: 'ACTIVO'
      });
      fetchLocations();
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* FORMULARIO */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Registrar Nuevo Lugar / Aliado</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Lugar / Organización</label>
              <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-blue-500 outline-none" placeholder="Ej: Albergue 4 Patas" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Acción</label>
              <select name="action_line" value={formData.action_line} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg bg-white">
                <option value="Animalista">Animalista</option>
                <option value="Ambiental">Ambiental</option>
                <option value="Social">Social</option>
                <option value="Educativo">Educativo</option>
                <option value="Salud">Salud</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Encargado(a)</label>
              <input type="text" name="manager_name" value={formData.manager_name} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="Nombre del contacto principal" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de Contacto</label>
              <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="Ej: 999888777" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
              <input type="text" name="address" required value={formData.address} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Distrito</label>
              <input type="text" name="district" required value={formData.district} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="Ej: San Martín de Porres" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Punto de Encuentro</label>
              <input type="text" name="meeting_point" value={formData.meeting_point} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="Ej: Puerta principal / Estación de tren" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link de Google Maps</label>
              <input type="url" name="maps_link" value={formData.maps_link} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="https://maps.app.goo.gl/..." />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indicaciones Especiales</label>
            <textarea name="special_instructions" value={formData.special_instructions} onChange={handleChange} rows={2} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="Ej: Llevar botas de agua, tocar timbre rojo..."></textarea>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg transition">
              {loading ? 'Guardando...' : 'Guardar Lugar'}
            </button>
          </div>
        </form>
      </div>

      {/* LISTA */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Directorio de Lugares</h2>
        {fetching ? <p className="text-gray-500">Cargando...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-3 border-b">Nombre</th>
                  <th className="p-3 border-b">Línea</th>
                  <th className="p-3 border-b">Distrito</th>
                  <th className="p-3 border-b">Encargado</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-gray-50">
                    <td className="p-3 border-b font-medium">{loc.name}</td>
                    <td className="p-3 border-b text-gray-600">{loc.action_line}</td>
                    <td className="p-3 border-b text-gray-600">{loc.district}</td>
                    <td className="p-3 border-b text-gray-600">{loc.manager_name || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}