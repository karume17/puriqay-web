import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Search, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export default function AvailableJornadas() {
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [inscripciones, setInscripciones] = useState<any>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedJornadas, setExpandedJornadas] = useState<string[]>([]);
  
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => {
    const today = new Date();
    const currentYear = today.getFullYear().toString();
    const currentMonthStr = today.toLocaleString('es-PE', { month: 'long' });
    const capitalizedMonth = currentMonthStr.charAt(0).toUpperCase() + currentMonthStr.slice(1);
    return [`${currentYear}-${capitalizedMonth}`];
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedJornadaId, setSelectedJornadaId] = useState('');
  const [justificationType, setJustificationType] = useState('Salud');
  const [justificationText, setJustificationText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile) setUserRole(profile.role);

    const today = new Date().toISOString().split('T')[0];
    const { data: jorData } = await supabase
      .from('jornadas')
      .select('*, locations(name, district, meeting_point)')
      .gte('date', today)
      .order('date', { ascending: true });
    
    if (jorData) setJornadas(jorData);

    const { data: insData } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('volunteer_id', user.id);

    if (insData) {
      const inscMap: any = {};
      insData.forEach(ins => { inscMap[ins.jornada_id] = ins; });
      setInscripciones(inscMap);
    }
    setLoading(false);
  };

  const handleCommitment = async (jornadaId: string, status: string, type: string = '', text: string = '') => {
    if (!userId) return;
    
    const existing = inscripciones[jornadaId];
    let hasChanged = false;

    if (existing) {
      if (existing.status === status) return;
      hasChanged = true;
    }

    const payload = {
      jornada_id: jornadaId,
      volunteer_id: userId,
      status: status,
      justification_type: type,
      justification_text: text,
      has_changed: existing ? hasChanged : false,
      updated_at: new Date().toISOString()
    };

    let error;
    if (existing) {
      const { error: updateError } = await supabase.from('inscripciones').update(payload).eq('id', existing.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('inscripciones').insert([payload]);
      error = insertError;
    }

    if (error) {
      alert('Error al guardar la respuesta: ' + error.message);
    } else {
      setShowModal(false);
      setJustificationText('');
      setJustificationType('Salud');
      loadData(); 
    }
  };

  const openJustificationModal = (jornadaId: string) => {
    setSelectedJornadaId(jornadaId);
    setShowModal(true);
  };

  const toggleExpandJornada = (id: string) => {
    setExpandedJornadas(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => prev.includes(groupKey) ? prev.filter(item => item !== groupKey) : [...prev, groupKey]);
  };

  const groupedJornadas = useMemo(() => {
    const filtered = jornadas.filter(jor => 
      jor.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.reduce((acc: any, jor) => {
      const [yearStr, monthNumStr] = jor.date.split('-');
      const year = yearStr;
      
      const dateObj = new Date(parseInt(yearStr), parseInt(monthNumStr) - 1, 1);
      const month = dateObj.toLocaleString('es-PE', { month: 'long' });
      const capitalizedMonth = month.charAt(0).toUpperCase() + month.slice(1);

      if (!acc[year]) acc[year] = {};
      if (!acc[year][capitalizedMonth]) acc[year][capitalizedMonth] = [];
      
      acc[year][capitalizedMonth].push(jor);
      return acc;
    }, {});
  }, [jornadas, searchQuery]);

  if (loading) return <p className="text-gray-500 font-medium">Cargando jornadas disponibles...</p>;

  return (
    <div className="space-y-6 relative">
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {userRole === 'VOLUNTARIO' ? "Próximas Jornadas" : "Confirmación de Asistencia"}
          </h2>
          <p className="text-gray-600 mb-6">
            {userRole === 'VOLUNTARIO' 
              ? "Explora las actividades y anótate para participar." 
              : "Como equipo interno, es tu deber confirmar o justificar tu asistencia a cada jornada."}
          </p>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar por nombre de jornada..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        {Object.keys(groupedJornadas).length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500">No se encontraron jornadas futuras.</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {Object.keys(groupedJornadas).sort().reverse().map(year => (
              <div key={year}>
                <h3 className="text-2xl font-black text-gray-800 border-b-2 border-gray-800 pb-2 mb-4">{year}</h3>
                
                {Object.keys(groupedJornadas[year]).map(month => {
                  const groupKey = `${year}-${month}`;
                  const isGroupExpanded = expandedGroups.includes(groupKey);
                  const jornadasDelMes = groupedJornadas[year][month];

                  // MAGIA DEL SEMÁFORO: Calculamos si falta responder al menos 1 en este mes
                  const hayPendientes = jornadasDelMes.some((jor: any) => {
                    const miEstado = inscripciones[jor.id] ? inscripciones[jor.id].status : null;
                    return userRole !== 'VOLUNTARIO' && !miEstado;
                  });

                  return (
                    <div key={groupKey} className="mb-4">
                      
                      <button 
                        onClick={() => toggleGroup(groupKey)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          isGroupExpanded ? 'bg-gray-100 text-gray-800' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <h4 className="text-md font-bold uppercase tracking-wider">{month}</h4>
                          {/* INDICADOR VISUAL PARA INTERNOS */}
                          {userRole !== 'VOLUNTARIO' && (
                            hayPendientes ? (
                              <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full border border-yellow-200">
                                <AlertCircle size={14} /> Pendientes
                              </span>
                            ) : (
                              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">
                                ✅ Completo
                              </span>
                            )
                          )}
                        </div>
                        {isGroupExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                      
                      {isGroupExpanded && (
                        <div className="space-y-3 mt-3 ml-2 md:ml-4 border-l-2 border-gray-100 pl-4">
                          {jornadasDelMes.map((jor: any) => {
                            const miInscripcion = inscripciones[jor.id];
                            const miEstado = miInscripcion ? miInscripcion.status : null;
                            const isExpanded = expandedJornadas.includes(jor.id);
                            const isPending = userRole !== 'VOLUNTARIO' && !miEstado;

                            return (
                              <div key={jor.id} className={`border rounded-xl transition-all duration-200 overflow-hidden ${isExpanded ? 'shadow-md border-blue-200' : 'hover:shadow hover:border-gray-300 bg-white'}`}>
                                
                                <button 
                                  onClick={() => toggleExpandJornada(jor.id)}
                                  className={`w-full text-left p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 ${isExpanded ? 'bg-blue-50' : 'bg-white'}`}
                                >
                                  <div className="flex-1">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                      <h5 className="font-bold text-gray-800 text-lg">{jor.name}</h5>
                                      
                                      {isPending && (
                                        <span className="flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full border border-yellow-200">
                                          <AlertCircle size={14} /> Pendiente
                                        </span>
                                      )}
                                      {miInscripcion?.has_changed && (
                                        <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-full">
                                          ⚠️ (C) Cambió
                                        </span>
                                      )}
                                      {miEstado === 'ASISTIRÁ' && !miInscripcion?.has_changed && (
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">Confirmado</span>
                                      )}
                                      {miEstado === 'NO ASISTIRÁ' && !miInscripcion?.has_changed && (
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full">No asistirá</span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">
                                      {/* PARCHE DE ZONA HORARIA APLICADO AQUÍ */}
                                      📅 {new Date(jor.date + 'T12:00:00').toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric' })} • ⏰ {jor.start_time.slice(0,5)}
                                    </p>
                                  </div>
                                  <div className="text-gray-400">
                                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                  </div>
                                </button>

                                {isExpanded && (
                                  <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                      <div>
                                        <p className="text-sm text-gray-500 mb-1">Ubicación</p>
                                        <p className="font-medium text-gray-800">📍 {jor.locations?.name} ({jor.locations?.district})</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-500 mb-1">Punto de Encuentro</p>
                                        <p className="font-medium text-gray-800">📌 {jor.locations?.meeting_point || 'Por definir'}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-200">
                                      {userRole === 'VOLUNTARIO' ? (
                                        <button 
                                          onClick={() => handleCommitment(jor.id, 'ASISTIRÁ')}
                                          disabled={miEstado === 'ASISTIRÁ'}
                                          className={`w-full md:w-auto py-2.5 px-6 rounded-lg font-bold transition ${
                                            miEstado === 'ASISTIRÁ'
                                              ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                                          }`}
                                        >
                                          {miEstado === 'ASISTIRÁ' ? '✅ Ya estás inscrito' : '✋ Inscribirme a esta jornada'}
                                        </button>
                                      ) : (
                                        <div>
                                          <p className="text-sm font-medium text-gray-700 mb-3">Tu respuesta es obligatoria:</p>
                                          <div className="flex flex-col sm:flex-row gap-3">
                                            <button 
                                              onClick={() => handleCommitment(jor.id, 'ASISTIRÁ')}
                                              className={`flex-1 py-2.5 rounded-lg font-bold transition border ${
                                                miEstado === 'ASISTIRÁ' 
                                                  ? 'bg-green-600 text-white border-green-600 shadow-md ring-2 ring-green-200 ring-offset-1' 
                                                  : 'bg-white text-green-600 border-green-600 hover:bg-green-50'
                                              }`}
                                            >
                                              Sí, asistiré
                                            </button>
                                            <button 
                                              onClick={() => openJustificationModal(jor.id)}
                                              className={`flex-1 py-2.5 rounded-lg font-bold transition border ${
                                                miEstado === 'NO ASISTIRÁ' 
                                                  ? 'bg-red-600 text-white border-red-600 shadow-md ring-2 ring-red-200 ring-offset-1' 
                                                  : 'bg-white text-red-600 border-red-600 hover:bg-red-50'
                                              }`}
                                            >
                                              No asistiré
                                            </button>
                                          </div>
                                          {miEstado === 'NO ASISTIRÁ' && (
                                            <div className="mt-3 bg-red-50 p-3 rounded-lg border border-red-100">
                                              <p className="text-sm text-red-800">
                                                <strong>Motivo de inasistencia:</strong> {miInscripcion.justification_type}
                                              </p>
                                              {miInscripcion.justification_text && (
                                                <p className="text-sm text-red-600 italic mt-1">"{miInscripcion.justification_text}"</p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Justificar Inasistencia</h3>
            <p className="text-sm text-gray-600 mb-4">Como miembro del equipo interno, es obligatorio registrar el motivo de tu inasistencia.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo Principal</label>
                <select value={justificationType} onChange={(e) => setJustificationType(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-gray-50 focus:ring-blue-500 outline-none">
                  <option value="Salud">Salud (Enfermedad/Cita médica)</option>
                  <option value="Trabajo/Estudio">Cruce con Trabajo / Estudios</option>
                  <option value="Problema Familiar">Urgencia Familiar</option>
                  <option value="Cruce de Horarios">Cruce con otra actividad de Puriqay</option>
                  <option value="Otro">Otro motivo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Detalle (Opcional)</label>
                <textarea value={justificationText} onChange={(e) => setJustificationText(e.target.value)} rows={3} placeholder="Explica brevemente..." className="w-full px-4 py-2 border rounded-lg bg-gray-50 focus:ring-blue-500 outline-none"></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Cancelar</button>
              <button onClick={() => handleCommitment(selectedJornadaId, 'NO ASISTIRÁ', justificationType, justificationText)} className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition">Confirmar Inasistencia</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}