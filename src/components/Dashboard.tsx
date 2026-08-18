import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import VolunteerList from './VolunteerList';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); // Nos regresa a la pantalla de login
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Administración - Puriqay</h1>
          <button 
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition"
          >
            Cerrar Sesión
          </button>
        </div>
        <VolunteerList />
      </div>
    </div>
  );
}