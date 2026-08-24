import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function AttendanceScanner() {
  // Estados para Jornadas y Selección
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [selectedJornada, setSelectedJornada] = useState('');
  
  // Estados para el Escáner
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isScanning, setIsScanning] = useState(true);

  // Estados para el Reporte en Vivo
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [stats, setStats] = useState({ inscritos: 0, total: 0, internos: 0, externos: 0 });

  useEffect(() => {
    fetchJornadas();
  }, []);

  // Cuando cambie la jornada, traemos sus estadísticas
  useEffect(() => {
    if (selectedJornada) {
      fetchAsistencias(selectedJornada);
    } else {
      setAsistencias([]);
      setStats({ inscritos: 0, total: 0, internos: 0, externos: 0 });
    }
  }, [selectedJornada]);

  const fetchJornadas = async () => {
    // Tomamos la fecha actual ajustada a Perú para evitar problemas de zona horaria
    const todayObj = new Date();
    todayObj.setHours(todayObj.getHours() - 5);
    const today = todayObj.toISOString().split('T')[0];
    
    // Solo mostramos jornadas de hoy o futuras (Nada de históricos)
    const { data } = await supabase
      .from('jornadas')
      .select('id, name, date')
      .gte('date', today)
      .order('date', { ascending: true });
    
    if (data) setJornadas(data);
  };

  const fetchAsistencias = async (jornadaId: string) => {
    setLoadingStats(true);
    
    // 1. Buscamos cuánta gente se INSCRIBIÓ
    const { data: insData } = await supabase
      .from('inscripciones')
      .select('id')
      .eq('jornada_id', jornadaId)
      .eq('status', 'ASISTIRÁ'); // Contamos solo los que confirmaron
    
    const totalInscritos = insData ? insData.length : 0;

    // 2. Buscamos quiénes ASISTIERON realmente (Ordenados por el más reciente arriba)
    const { data, error } = await supabase
      .from('asistencias')
      .select('*, profiles(first_name, last_name, role)')
      .eq('jornada_id', jornadaId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAsistencias(data);
      let internos = 0;
      let externos = 0;
      
      data.forEach(asist => {
        if (asist.profiles?.role === 'VOLUNTARIO') externos++;
        else internos++;
      });
      
      setStats({ inscritos: totalInscritos, total: data.length, internos, externos });
    }
    setLoadingStats(false);
  };

  const handleScan = async (scannedData: any) => {
    if (!scannedData || !isScanning) return;
    
    setIsScanning(false);
    const token = Array.isArray(scannedData) ? scannedData[0].rawValue : scannedData;
    setMessage({ text: 'Buscando voluntario...', type: 'blue' });

    // 1. Buscamos el perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .eq('qr_token', token)
      .single();

    if (!profile) {
      setMessage({ text: '❌ Código QR no válido o no encontrado.', type: 'red' });
      setTimeout(() => setIsScanning(true), 3000);
      return;
    }

    // 2. Registramos asistencia
    const { error } = await supabase
      .from('asistencias')
      .insert([{ jornada_id: selectedJornada, volunteer_id: profile.id }]);

    if (error) {
      if (error.code === '23505') { 
        setMessage({ text: `⚠️ ${profile.first_name} ya estaba registrado en esta jornada.`, type: 'yellow' });
      } else {
        setMessage({ text: '❌ Error al guardar asistencia.', type: 'red' });
      }
    } else {
      setMessage({ text: `✅ ¡${profile.first_name} ${profile.last_name} registrado!`, type: 'green' });
      // MAGIA: Actualizamos las estadísticas en vivo apenas escanea
      fetchAsistencias(selectedJornada);
    }

    // Reactivamos la cámara
    setTimeout(() => {
      setMessage({ text: '', type: '' });
      setIsScanning(true);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* CABECERA Y SELECTOR */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona la Jornada Activa para iniciar el control:</label>
        <select 
          value={selectedJornada} 
          onChange={(e) => setSelectedJornada(e.target.value)} 
          className="w-full md:w-1/2 px-4 py-3 border rounded-lg bg-gray-50 font-medium outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Elige una jornada --</option>
          {jornadas.map(j => (
            <option key={j.id} value={j.id}>{j.name} ({new Date(j.date + 'T12:00:00').toLocaleDateString('es-PE')})</option>
          ))}
        </select>
        {jornadas.length === 0 && (
          <p className="text-sm text-orange-500 mt-2">No hay jornadas programadas para hoy o el futuro.</p>
        )}
      </div>

      {selectedJornada && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA IZQUIERDA: EL ESCÁNER */}
          <div className="lg:col-span-1 flex flex-col items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-fit">
            <h3 className="font-bold text-gray-800 mb-4 w-full text-center">Cámara de Registro</h3>
            
            {message.text && (
              <div className={`w-full p-3 mb-4 rounded-lg font-bold text-center text-sm ${
                message.type === 'green' ? 'bg-green-100 text-green-700' :
                message.type === 'red' ? 'bg-red-100 text-red-700' :
                message.type === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {message.text}
              </div>
            )}

            <div className="w-full max-w-[280px] rounded-xl overflow-hidden border-4 border-gray-100 shadow-inner relative">
              {isScanning ? (
                <Scanner onScan={handleScan} />
              ) : (
                <div className="w-full aspect-square bg-gray-50 flex items-center justify-center">
                  <p className="text-gray-400 font-medium">Procesando...</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Apunta el código QR del voluntario al centro del recuadro.</p>
          </div>

          {/* COLUMNA DERECHA: ESTADÍSTICAS Y TABLA EN VIVO */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Tarjetas de Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center border-t-4 border-t-purple-500">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Esperados</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.inscritos}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center border-t-4 border-t-blue-500">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Asistencia</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">{stats.total}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Internos</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.internos}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm text-center">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">Externos</p>
                <p className="text-2xl font-bold text-orange-500 mt-1">{stats.externos}</p>
              </div>
            </div>

            {/* Tabla en Vivo */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '400px' }}>
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-gray-800">Últimos Registros (En Vivo)</h3>
                {loadingStats && <span className="text-xs text-blue-500 font-bold animate-pulse">Actualizando...</span>}
              </div>
              <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-white sticky top-0 shadow-sm">
                    <tr className="text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-3 border-b font-medium">Voluntario</th>
                      <th className="p-3 border-b font-medium">Tipo</th>
                      <th className="p-3 border-b font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map((asist) => (
                      <tr key={asist.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3 border-b font-medium text-gray-800 text-sm">
                          {asist.profiles?.first_name || 'Sin nombre'} {asist.profiles?.last_name || ''}
                        </td>
                        <td className="p-3 border-b">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            asist.profiles?.role === 'VOLUNTARIO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {asist.profiles?.role === 'VOLUNTARIO' ? 'Externo' : 'Interno'}
                          </span>
                        </td>
                        <td className="p-3 border-b text-gray-500 text-sm font-medium">
                          {new Date(asist.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {asistencias.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-8 text-center text-gray-400">Nadie ha registrado asistencia aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}