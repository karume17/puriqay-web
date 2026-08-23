import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Clock, CheckCircle, Link as LinkIcon, ExternalLink } from 'lucide-react';

export default function MarketingBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Formulario
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Post');
  const [assignedTo, setAssignedTo] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [postDate, setPostDate] = useState('');
  const [canvaUrl, setCanvaUrl] = useState('');
  
  // Redes Sociales (Checkboxes)
  const [networks, setNetworks] = useState({
    Facebook: false,
    Instagram: false,
    TikTok: false,
    LinkedIn: false,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // 1. Cargamos al equipo interno (Puedes filtrar por area === 'Marketing' si ya los actualizaste en la BD)
    const { data: teamData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, area')
      .in('role', ['ADMIN', 'COORDINADOR']);
    if (teamData) setTeam(teamData);

    // 2. Cargamos las tareas
    const { data: taskData } = await supabase
      .from('marketing_tasks')
      .select('*, profiles(first_name, last_name)')
      .order('post_date', { ascending: true });
    if (taskData) setTasks(taskData);
    
    setFetching(false);
  };

  const handleNetworkChange = (network: string) => {
    setNetworks(prev => ({ ...prev, [network]: !prev[network as keyof typeof prev] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedNetworks = Object.keys(networks).filter(n => networks[n as keyof typeof networks]);

    if (selectedNetworks.length === 0) {
      alert('Debes seleccionar al menos una red social.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('marketing_tasks').insert([{
      title,
      content_type: contentType,
      assigned_to: assignedTo,
      networks: selectedNetworks,
      canva_url: canvaUrl || null,
      draft_date: draftDate,
      post_date: postDate,
      status: 'Pendiente'
    }]);

    if (error) {
      alert('Error al crear tarea: ' + error.message);
    } else {
      alert('¡Tarea de Marketing asignada!');
      setTitle(''); setCanvaUrl(''); setDraftDate(''); setPostDate('');
      setNetworks({ Facebook: false, Instagram: false, TikTok: false, LinkedIn: false });
      fetchData();
    }
    setLoading(false);
  };

  // Función para cambiar el estado y registrar la "Fecha Real" automáticamente
  const updateStatus = async (id: string, newStatus: string) => {
    let payload: any = { status: newStatus };
    
    // Si lo pasa a "En Revisión", guardamos la hora exacta en la que entregó
    if (newStatus === 'En Revisión') {
      payload.real_delivery_date = new Date().toISOString();
    }

    await supabase.from('marketing_tasks').update(payload).eq('id', id);
    fetchData(); // Recargamos para ver los cambios
  };

  // Motor del Semáforo de Alertas
  const getAlertStatus = (draft_date: string, status: string) => {
    if (status === 'Publicado' || status === 'En Revisión') return null; // No hay alerta si ya entregó
    
    const today = new Date();
    // Forzamos el final del día para la fecha límite
    const limit = new Date(draft_date + 'T23:59:59'); 
    
    const diffTime = limit.getTime() - today.getTime();
    const diffHours = diffTime / (1000 * 3600);

    if (diffHours < 0) return { type: 'red', text: 'ATRASADO', icon: AlertCircle };
    if (diffHours <= 48) return { type: 'yellow', text: 'Vence pronto', icon: Clock };
    return { type: 'green', text: 'A tiempo', icon: CheckCircle };
  };

  return (
    <div className="space-y-8">
      {/* FORMULARIO DE CREACIÓN */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Nueva Tarea de Marketing</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título de la Campaña <span className="text-red-500">*</span></label>
              <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" placeholder="Ej: Fiestas Patrias" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contenido <span className="text-red-500">*</span></label>
              <select required value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none bg-white">
                <option value="Post">Post (Imagen estática)</option>
                <option value="Carrusel">Carrusel</option>
                <option value="Reel">Reel / Video corto</option>
                <option value="Historia">Historia (Story)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Encargado <span className="text-red-500">*</span></label>
              <select required value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none bg-white">
                <option value="">-- Selecciona Diseñador --</option>
                {team.map(member => (
                  <option key={member.id} value={member.id}>{member.first_name} {member.last_name} {member.area ? `(${member.area})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Redes Sociales (Destino) <span className="text-red-500">*</span></label>
              <div className="flex gap-4">
                {Object.keys(networks).map(net => (
                  <label key={net} className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" checked={networks[net as keyof typeof networks]} onChange={() => handleNetworkChange(net)} className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-gray-700">{net}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link de Canva (Opcional por ahora)</label>
              <div className="flex relative">
                <LinkIcon className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input type="url" value={canvaUrl} onChange={(e) => setCanvaUrl(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" placeholder="https://canva.com/..." />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Límite de ENTREGA (Borrador) <span className="text-red-500">*</span></label>
              <input type="date" required value={draftDate} onChange={(e) => setDraftDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de PUBLICACIÓN (Post) <span className="text-red-500">*</span></label>
              <input type="date" required value={postDate} onChange={(e) => setPostDate(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-lg transition duration-200">
              {loading ? 'Guardando...' : 'Asignar Tarea'}
            </button>
          </div>
        </form>
      </div>

      {/* TABLERO DE CONTROL */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Tablero de Entregables</h2>
        {fetching ? <p className="text-gray-500">Cargando tablero...</p> : (
          <div className="grid grid-cols-1 gap-4">
            {tasks.map(task => {
              const alert = getAlertStatus(task.draft_date, task.status);
              
              return (
                <div key={task.id} className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-gray-50 hover:bg-white transition shadow-sm">
                  
                  {/* Info Principal */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full uppercase">{task.content_type}</span>
                      <h3 className="font-bold text-lg text-gray-800">{task.title}</h3>
                      {alert && (
                        <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full border ${
                          alert.type === 'red' ? 'bg-red-100 text-red-700 border-red-300' : 
                          alert.type === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                          'bg-green-100 text-green-700 border-green-300'
                        }`}>
                          <alert.icon size={12} /> {alert.text}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      👤 <strong>Encargado:</strong> {task.profiles?.first_name} {task.profiles?.last_name}
                      <span className="mx-2">|</span> 
                      📱 <strong>Redes:</strong> {task.networks.join(', ')}
                    </p>
                    
                    <div className="flex gap-4 text-sm">
                      <p className="text-gray-500">
                        Entregar: <span className="font-bold text-gray-700">{task.draft_date.split('-').reverse().join('/')}</span>
                      </p>
                      <p className="text-gray-500">
                        Publicar: <span className="font-bold text-gray-700">{task.post_date.split('-').reverse().join('/')}</span>
                      </p>
                      {task.canva_url && (
                        <a href={task.canva_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-medium">
                          Ver Canva <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Controles de Estado */}
                  <div className="w-full md:w-48">
                    <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Estado actual</label>
                    <select 
                      value={task.status}
                      onChange={(e) => updateStatus(task.id, e.target.value)}
                      className={`w-full px-3 py-2 border-2 rounded-lg font-bold outline-none cursor-pointer ${
                        task.status === 'Pendiente' ? 'border-gray-300 text-gray-700 bg-gray-100' :
                        task.status === 'En Revisión' ? 'border-blue-400 text-blue-700 bg-blue-50' :
                        task.status === 'Observado' ? 'border-orange-400 text-orange-700 bg-orange-50' :
                        'border-green-500 text-green-700 bg-green-50' // Publicado
                      }`}
                    >
                      <option value="Pendiente">⏳ Pendiente</option>
                      <option value="En Revisión">👀 En Revisión</option>
                      <option value="Observado">✍️ Observado</option>
                      <option value="Publicado">✅ Publicado</option>
                    </select>
                    
                    {/* Métrica de entrega real */}
                    {task.real_delivery_date && (
                      <p className="text-[10px] text-gray-400 mt-1 text-center">
                        Entregado el: {new Date(task.real_delivery_date).toLocaleDateString('es-PE')}
                      </p>
                    )}
                  </div>

                </div>
              );
            })}
            {tasks.length === 0 && <p className="text-center text-gray-500 p-4">No hay tareas de marketing registradas.</p>}
          </div>
        )}
      </div>
    </div>
  );
}