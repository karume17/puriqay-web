import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import VolunteerList from './VolunteerList';
import QRCode from 'react-qr-code'; // Nuestra nueva herramienta

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    // 1. Obtenemos quién inició sesión
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/');
      return;
    }

    // 2. Buscamos su perfil para ver qué rol tiene y su código secreto
    const { data, error } = await supabase
      .from('profiles')
      .select('role, qr_token')
      .eq('id', user.id)
      .single();

    // Le agregamos estas 3 líneas para usar la variable "error"
    if (error) {
      console.error("Error al cargar el perfil:", error.message);
    }

    if (data) {
      setRole(data.role);
      setQrToken(data.qr_token);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Cargando tu perfil de Puriqay...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {role === 'VOLUNTARIO' ? 'Mi Perfil Voluntario' : 'Panel de Administración'}
          </h1>
          <button 
            onClick={handleLogout}
            className="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-lg font-medium transition text-sm md:text-base"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* =========================================
            VISTA SOLO PARA ADMIN Y COORDINADORES 
            ========================================= */}
        {(role === 'ADMIN' || role === 'COORDINADOR') && (
          <div>
            <p className="text-gray-600 mb-6">Hola equipo interno. Aquí pueden gestionar los datos.</p>
            <VolunteerList />
          </div>
        )}

        {/* =========================================
            VISTA SOLO PARA VOLUNTARIOS EXTERNOS 
            ========================================= */}
        {role === 'VOLUNTARIO' && (
          <div className="flex flex-col items-center justify-center py-8">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">¡Bienvenido a Puriqay!</h2>
            <p className="text-gray-600 text-center max-w-md mb-8">
              Muestra este código QR al llegar a las actividades para registrar tu asistencia automáticamente.
            </p>
            
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100">
              {qrToken ? (
                <QRCode value={qrToken} size={220} level="H" />
              ) : (
                <p>Generando tu QR...</p>
              )}
            </div>
            
            <p className="text-xs text-gray-400 mt-4">Token seguro: {qrToken}</p>
          </div>
        )}
        
      </div>
    </div>
  );
}