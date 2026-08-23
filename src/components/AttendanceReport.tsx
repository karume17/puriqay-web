import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function AttendanceReport() {
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [selectedJornada, setSelectedJornada] = useState('');
  const [asistencias, setAsistencias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // ESTADÍSTICAS ACTUALIZADAS: Agregamos "inscritos"
  const [stats, setStats] = useState({ inscritos: 0, total: 0, internos: 0, externos: 0 });

  useEffect(() => {
    fetchJornadas();
  }, []);

  const fetchJornadas = async () => {
    const { data } = await supabase
      .from('jornadas')
      .select('id, name, date')
      .order('date', { ascending: false }); 
    if (data) setJornadas(data);
  };

  const fetchAsistencias = async (jornadaId: string) => {
    if (!jornadaId) {
      setAsistencias([]);
      setStats({ inscritos: 0, total: 0, internos: 0, externos: 0 });
      return;
    }

    setLoading(true);
    
    // 1. Buscamos cuánta gente se INSCRIBIÓ (Proyección)
    const { data: insData } = await supabase
      .from('inscripciones')
      .select('id')
      .eq('jornada_id', jornadaId);
    
    const totalInscritos = insData ? insData.length : 0;

    // 2. Buscamos quiénes ASISTIERON realmente (Escaneo de QR)
    const { data, error } = await supabase
      .from('asistencias')
      .select('*, profiles(first_name, last_name, role)')
      .eq('jornada_id', jornadaId);

    if (!error && data) {
      setAsistencias(data);
      
      let internos = 0;
      let externos = 0;
      
      data.forEach(asist => {
        if (asist.profiles?.role === 'VOLUNTARIO') {
          externos++;
        } else {
          internos++;
        }
      });
      
      setStats({ inscritos: totalInscritos, total: data.length, internos, externos });
    }
    setLoading(false);
  };

  const handleJornadaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const jId = e.target.value;
    setSelectedJornada(jId);
    fetchAsistencias(jId);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Selecciona una Jornada para ver el reporte:</label>
        <select 
          value={selectedJornada} 
          onChange={handleJornadaChange}
          className="w-full md:w-1/2 px-4 py-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">-- Selecciona una jornada --</option>
          {jornadas.map(j => (
            <option key={j.id} value={j.id}>{j.name} ({new Date(j.date).toLocaleDateString('es-PE')})</option>
          ))}
        </select>
      </div>

      {selectedJornada && (
        <>
          {/* TARJETAS DE ESTADÍSTICAS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center border-t-4 border-t-purple-500">
              <p className="text-gray-500 text-sm font-medium">Pre-Inscritos</p>
              <p className="text-4xl font-bold text-purple-600 mt-2">{stats.inscritos}</p>
              <p className="text-xs text-gray-400 mt-1">Esperados</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center border-t-4 border-t-blue-500">
              <p className="text-gray-500 text-sm font-medium">Asistencia Real</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">Escaneados</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-gray-500 text-sm font-medium">Volunt. Internos</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{stats.internos}</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
              <p className="text-gray-500 text-sm font-medium">Volunt. Externos</p>
              <p className="text-4xl font-bold text-orange-500 mt-2">{stats.externos}</p>
            </div>
          </div>

          {/* TABLA DE ASISTENTES */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Lista Detallada de Asistencia (QR)</h3>
            {loading ? (
              <p className="text-gray-500">Cargando datos...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="p-3 border-b rounded-tl-lg">Voluntario</th>
                      <th className="p-3 border-b">Tipo</th>
                      <th className="p-3 border-b rounded-tr-lg">Hora de Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asistencias.map((asist) => (
                      <tr key={asist.id} className="hover:bg-gray-50">
                        <td className="p-3 border-b font-medium text-gray-800">
                          {asist.profiles?.first_name || 'Sin nombre'} {asist.profiles?.last_name || ''}
                        </td>
                        <td className="p-3 border-b">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            asist.profiles?.role === 'VOLUNTARIO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {asist.profiles?.role === 'VOLUNTARIO' ? 'Externo' : 'Interno'}
                          </span>
                        </td>
                        <td className="p-3 border-b text-gray-600">
                          {new Date(asist.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                    {asistencias.length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-gray-500">No hay asistencias registradas aún.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}