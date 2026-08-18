import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import VolunteerList from './VolunteerList';
import Projects from './Projects';
import QRCode from 'react-qr-code';
// Importamos los íconos
import { Users, Briefcase, QrCode, LogOut, ChevronLeft, Menu, Calendar } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Controles de diseño de la pantalla
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('');

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate('/');
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('role, qr_token')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error al cargar el perfil:", error.message);
    }

    if (data) {
      setRole(data.role);
      setQrToken(data.qr_token);
      // Dependiendo del rol, lo mandamos a una pestaña por defecto
      if (data.role === 'VOLUNTARIO') {
        setActiveTab('qr');
      } else {
        setActiveTab('projects');
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // --------------------------------------------------------
  // MINICOMPONENTE: Botones del menú lateral
  // --------------------------------------------------------
  const SidebarItem = ({ id, label, icon: Icon }: any) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => setActiveTab(id)}
        className={`w-full flex items-center p-3 mb-2 rounded-lg transition-colors ${
          isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title={!isSidebarOpen ? label : ''}
      >
        <Icon size={24} className="min-w-[24px]" />
        {isSidebarOpen && <span className="ml-3 font-medium truncate">{label}</span>}
      </button>
    );
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-500 font-medium">Cargando Puriqay...</div>;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* ==========================================
          BARRA LATERAL (SIDEBAR)
          ========================================== */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        
        {/* Cabecera del Menú */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {isSidebarOpen && <h1 className="font-bold text-xl text-blue-600 truncate">Puriqay</h1>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 ml-auto"
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Opciones del Menú */}
        <nav className="flex-1 p-4 overflow-y-auto">
          
          {/* Si es del equipo interno, ve estas opciones */}
          {(role === 'ADMIN' || role === 'COORDINADOR') && (
            <>
              <SidebarItem id="projects" label="Proyectos" icon={Briefcase} />
              <SidebarItem id="volunteers" label="Voluntarios" icon={Users} />
              {/* <SidebarItem id="jornadas" label="Jornadas" icon={Calendar} /> (Lo activaremos pronto) */}
            </>
          )}

          {/* El código QR lo ven todos */}
          <SidebarItem id="qr" label="Mi Código QR" icon={QrCode} />
        </nav>

        {/* Pie del Menú (Cerrar Sesión) */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center p-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            title={!isSidebarOpen ? 'Cerrar Sesión' : ''}
          >
            <LogOut size={24} className="min-w-[24px]" />
            {isSidebarOpen && <span className="ml-3 font-medium truncate">Cerrar Sesión</span>}
          </button>
        </div>
      </div>

      {/* ==========================================
          CONTENIDO PRINCIPAL (DERECHA)
          ========================================== */}
      <div className="flex-1 overflow-y-auto p-8">
        
        {/* Renderizado Dinámico: Dependiendo del botón, mostramos una pantalla u otra */}
        {activeTab === 'projects' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Proyectos</h1>
            <Projects />
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Base de Datos de Voluntarios</h1>
            <VolunteerList />
          </div>
        )}

        {activeTab === 'qr' && (
          <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center mt-10">
            <h2 className="text-2xl font-bold text-blue-600 mb-2">Mi Credencial</h2>
            <p className="text-gray-600 mb-8">Muestra este código al llegar a las actividades.</p>
            
            <div className="flex justify-center p-4">
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