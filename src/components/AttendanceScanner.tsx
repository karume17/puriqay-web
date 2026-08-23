import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function AttendanceScanner() {
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [selectedJornada, setSelectedJornada] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    fetchJornadas();
  }, []);

  const fetchJornadas = async () => {
    const today = new Date().toISOString().split('T')[0];
    // Solo mostramos jornadas de hoy o futuras
    const { data } = await supabase
      .from('jornadas')
      .select('id, name, date')
      .gte('date', today)
      .order('date', { ascending: true });
    if (data) setJornadas(data);
  };

  const handleScan = async (scannedData: any) => {
    if (!scannedData || !isScanning) return;
    
    // Pausamos el escáner un par de segundos para evitar escaneos múltiples
    setIsScanning(false);
    
    // @yudiel/react-qr-scanner devuelve un array en sus últimas versiones
    const token = Array.isArray(scannedData) ? scannedData[0].rawValue : scannedData;

    setMessage({ text: 'Buscando voluntario...', type: 'blue' });

    // 1. Buscamos a quién le pertenece ese QR
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

    // 2. Registramos la asistencia
    const { error } = await supabase
      .from('asistencias')
      .insert([{ jornada_id: selectedJornada, volunteer_id: profile.id }]);

    if (error) {
      if (error.code === '23505') { // Código de error de Postgres para "Duplicado"
        setMessage({ text: `⚠️ ${profile.first_name} ya estaba registrado en esta jornada.`, type: 'yellow' });
      } else {
        setMessage({ text: '❌ Error al guardar asistencia.', type: 'red' });
      }
    } else {
      setMessage({ text: `✅ ¡Asistencia registrada: ${profile.first_name} ${profile.last_name}!`, type: 'green' });
    }

    // Reactivamos la cámara después de 3 segundos
    setTimeout(() => {
      setMessage({ text: '', type: '' });
      setIsScanning(true);
    }, 3000);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Control de Asistencia</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Selecciona la Jornada Activa</label>
        <select 
          value={selectedJornada} 
          onChange={(e) => setSelectedJornada(e.target.value)} 
          className="w-full px-4 py-3 border rounded-lg bg-gray-50 font-medium outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Elige una jornada para empezar a escanear --</option>
          {jornadas.map(j => (
            <option key={j.id} value={j.id}>{j.name} ({new Date(j.date).toLocaleDateString('es-PE')})</option>
          ))}
        </select>
      </div>

      {selectedJornada && (
        <div className="flex flex-col items-center">
          {message.text && (
            <div className={`w-full p-4 mb-4 rounded-lg font-bold text-center ${
              message.type === 'green' ? 'bg-green-100 text-green-700' :
              message.type === 'red' ? 'bg-red-100 text-red-700' :
              message.type === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="w-full max-w-sm rounded-xl overflow-hidden border-4 border-gray-100 shadow-inner relative">
            {isScanning ? (
              <Scanner onScan={handleScan} />
            ) : (
              <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500 font-medium">Procesando...</p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-4 text-center">Apunta la cámara al código QR del voluntario.</p>
        </div>
      )}
    </div>
  );
}