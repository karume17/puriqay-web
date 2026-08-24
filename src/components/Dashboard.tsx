import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import VolunteerList from './VolunteerList';
import Locations from './Locations';
import QRCode from 'react-qr-code';
import Jornadas from './Jornadas';
import AttendanceScanner from './AttendanceScanner';
import AvailableJornadas from './AvailableJornadas';
import MarketingBoard from './MarketingBoard';
import { Users, QrCode, LogOut, ChevronLeft, Menu, CalendarDays, CalendarCheck, MapPin, Camera, ClipboardList, Megaphone } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const [role, setRole] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null); // NUEVO: Guardamos el área
  const [qrToken, setQrToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
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

    // NUEVO: Traemos también el área desde la base de datos
    const { data, error } = await supabase
      .from('profiles')
      .select('role, qr_token, area')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error("Error al cargar el perfil:", error.message);
    }

    if (data) {
      setRole(data.role);
      setArea(data.area);
      setQrToken(data.qr_token);
      
      // CAMBIO: Todos inician en jornadas disponibles para evitar pantallas en blanco por falta de permisos
      setActiveTab('available_jornadas'); 
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

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

  // ==========================================
  // MATRIZ DE PERMISOS (RBAC)
  // ==========================================
  const isSuperAdmin = (area === 'Gerencia General' || area === 'Tecnologías de la Información') && role === 'ADMIN';
  const isProyectos = area === 'Gestión de Proyectos Sociales' && role === 'ADMIN';
  const isRRHH = area === 'Gestión Humana' && role === 'ADMIN';
  const isMarketing = area === 'Comunicación y Difusión'; // Admins y Coordinadores
  const isInternal = role === 'ADMIN' || role === 'COORDINADOR';
  const isVoluntario = role === 'VOLUNTARIO';

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      
      {/* BARRA LATERAL (SIDEBAR) */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {isSidebarOpen && <h1 className="font-bold text-xl text-blue-600 truncate">Puriqay</h1>}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 ml-auto"
          >
            {isSidebarOpen ? <ChevronLeft size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Indicador de Perfil (Opcional, muy útil para tus pruebas) */}
        {isSidebarOpen && (
          <div className="px-4 pt-4 pb-2 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-800">{role}</p>
            <p className="text-[10px] text-gray-500 truncate uppercase">{area}</p>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          
          {/* MÓDULOS DE GESTIÓN (EXCLUSIVOS POR ÁREA) */}
          {(isSuperAdmin || isProyectos) && <SidebarItem id="locations" label="Lugares" icon={MapPin} />}
          {(isSuperAdmin || isProyectos) && <SidebarItem id="jornadas" label="Jornadas" icon={CalendarDays} />}
          {(isSuperAdmin || isRRHH) && <SidebarItem id="volunteers" label="Voluntarios" icon={Users} />}
          {(isSuperAdmin || isMarketing) && <SidebarItem id="marketing" label="Área de Marketing" icon={Megaphone} />}

          {/* MÓDULOS ESTÁNDAR (TODOS LOS INTERNOS) */}
          {isInternal && (
            <>
              <SidebarItem id="available_jornadas" label="Próximas Jornadas" icon={CalendarCheck} />
              <SidebarItem id="scanner" label="Control de Asistencia" icon={Camera} />
            </>
          )}

          {/* MÓDULOS VOLUNTARIOS EXTERNOS */}
          {isVoluntario && (
            <SidebarItem id="available_jornadas" label="Próximas Jornadas" icon={CalendarCheck} />
          )}

          {/* CÓDIGO QR (TODOS) */}
          <SidebarItem id="qr" label="Mi Código QR" icon={QrCode} />
          
        </nav>

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

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 overflow-y-auto p-8">
        
        {activeTab === 'locations' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Directorio de Lugares Aliados</h1>
            <Locations />
          </div>
        )}

        {activeTab === 'jornadas' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Gestión de Jornadas</h1>
            <Jornadas />
          </div>
        )}

        {activeTab === 'volunteers' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Base de Datos de Voluntarios</h1>
            <VolunteerList />
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Escáner Operativo</h1>
            <AttendanceScanner />
          </div>
        )}

        {activeTab === 'available_jornadas' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Voluntariados Disponibles</h1>
            <AvailableJornadas />
          </div>
        )}

        {activeTab === 'marketing' && (
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              Gestión de Contenidos
            </h1>
            <MarketingBoard />
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