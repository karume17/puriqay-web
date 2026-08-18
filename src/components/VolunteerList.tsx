import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Le decimos a React qué datos tiene un perfil
type Profile = {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
};

export default function VolunteerList() {
  const [volunteers, setVolunteers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  // Esto hace que la lista se cargue automáticamente al entrar a la pantalla
  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }); // Los más nuevos primero

    if (error) {
      console.error('Error al cargar voluntarios:', error);
    } else {
      setVolunteers(data || []);
    }
    setLoading(false);
  };

  if (loading) return <p className="text-center text-gray-500 mt-8">Cargando voluntarios...</p>;

  return (
    <div className="mt-8 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Lista de Voluntarios Registrados</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
              <th className="p-3 border-b rounded-tl-lg">Correo Electrónico</th>
              <th className="p-3 border-b">Rol</th>
              <th className="p-3 border-b rounded-tr-lg">Estado</th>
            </tr>
          </thead>
          <tbody>
            {volunteers.map((vol) => (
              <tr key={vol.id} className="hover:bg-gray-50 transition">
                <td className="p-3 border-b text-gray-800">{vol.email || 'Sin correo registrado'}</td>
                <td className="p-3 border-b font-medium text-blue-600">{vol.role}</td>
                <td className="p-3 border-b">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${vol.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {vol.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}