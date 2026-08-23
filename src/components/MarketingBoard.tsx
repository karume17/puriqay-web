import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Clock, CheckCircle, ExternalLink, Send, Edit3, CheckCircle2 } from 'lucide-react';

export default function MarketingBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Sesión actual
  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Formulario
  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Post');
  const [assignedTo, setAssignedTo] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [postDate, setPostDate] = useState('');
  const [canvaUrl, setCanvaUrl] = useState('');
  
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
    setFetching(true);
    
    // Obtenemos quién está usando la app
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) setUserRole(profile.role);
    }

    // Cargamos al equipo para el selector (Solo internos)
    const { data: teamData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, area')
      .in('role', ['ADMIN', 'COORDINADOR']);
    if (teamData) setTeam(teamData);

    // Cargamos las tareas
    const { data: taskData } = await supabase
      .from('marketing_tasks')
      .select('*, profiles(first_name, last_name)')
      .order('post_date', { ascending: true });
    
    if (taskData) setTasks(taskData);
    setFetching(false);
  };

  // AUTOMATIZACIÓN DE FECHAS: Cuando pones Fecha de Publicación, calcula 7 días antes para el borrador
  const handlePostDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pDate = e.target.value;
    setPostDate(pDate);
    
    if (pDate) {
      const dateObj = new Date(pDate + 'T12:00:00');
      dateObj.setDate(dateObj.getDate() - 7); // Restamos 7 días exactos
      setDraftDate(dateObj.toISOString().split('T')[0]);
    } else {
      setDraftDate('');
    }
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
      alert('¡Tarea asignada con éxito!');
      setTitle(''); setCanvaUrl(''); setDraftDate(''); setPostDate('');
      setNetworks({ Facebook: false, Instagram: false, TikTok: false, LinkedIn: false });
      fetchData();
    }
    setLoading(false);
  };

  // MOTOR DEL FLUJO DE TRABAJO (Registra la hora exacta)
  const executeAction = async (id: string, newStatus: string) => {
    const payload: any = { status: newStatus };
    
    // Si el diseñador envía a revisión, estampamos su métrica de entrega
    if (newStatus === 'En Revisión') {
      payload.real_delivery_date = new Date().toISOString();
    }

    await supabase.from('marketing_tasks').update(payload).eq('id', id);
    fetchData(); // Recargamos tablero
  };

  const getAlertStatus = (draft_date: string, status: string) => {
    if (status === 'Publicado' || status === 'En Revisión') return null; 
    
    const today = new Date();
    const limit = new Date(draft_date + 'T23:59:59'); 
    
    const diffTime = limit.getTime() - today.getTime();
    const diffHours = diffTime / (1000 * 3600);

    if (diffHours < 0) return { type: 'red', text: 'ATRASADO', icon: AlertCircle };
    if (diffHours <= 48) return { type: 'yellow', text: 'Vence pronto', icon: Clock };
    return { type: 'green', text: 'A tiempo', icon: CheckCircle };
  };

  // REGLAS DE ACCESO: El Admin es el supervisor.
  const isSupervisor = userRole === 'ADMIN';

  // Filtramos la lista de tareas: El supervisor ve todo, el diseñador solo ve las suyas.
  const visibleTasks = isSupervisor ? tasks : tasks.filter(t => t.assigned_to === userId);

  return (
    <div className="space-y-8">
      
      {/* FORMULARIO: Solo lo ve el Supervisor (ADMIN) */}
      {isSupervisor && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Asignar Nueva Tarea (Supervisor)</h2>
          </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a <span className="text-red-500">*</span></label>
                <select required value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none bg-white">
                  <option value="">-- Selecciona Diseñador --</option>
                  {team.map(member => (
                    <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Carpeta / Link de Canva</label>
                <input type="url" value={canvaUrl} onChange={(e) => setCanvaUrl(e.target.value)} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" placeholder="https://canva.com/..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de PUBLICACIÓN en Redes <span className="text-red-500">*</span></label>
                <input type="date" required value={postDate} onChange={handlePostDateChange} className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Límite de ENTREGA de Diseño <span className="text-xs text-gray-400">(Automático: -7 días)</span></label>
                <input type="date" readOnly value={draftDate} className="w-full px-4 py-2 border rounded-lg bg-gray-100 text-gray-600 outline-none cursor-not-allowed" />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-8 rounded-lg transition duration-200">
                {loading ? 'Guardando...' : 'Asignar Tarea'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLERO DE CONTROL DE TAREAS */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          {isSupervisor ? 'Todas las Tareas de Marketing' : 'Mis Tareas Asignadas'}
        </h2>
        
        {fetching ? <p className="text-gray-500">Cargando tablero...</p> : (
          <div className="grid grid-cols-1 gap-4">
            {visibleTasks.map(task => {
              const alert = getAlertStatus(task.draft_date, task.status);
              const isMyTask = task.assigned_to === userId;
              
              return (
                <div key={task.id} className={`border rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition shadow-sm ${
                  task.status === 'Publicado' ? 'bg-gray-50 border-gray-200' : 'bg-white border-purple-100'
                }`}>
                  
                  {/* Info de la Tarea */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${
                        task.status === 'Pendiente' ? 'bg-gray-100 text-gray-600' :
                        task.status === 'En Revisión' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'Observado' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.status}
                      </span>
                      <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded-full">{task.content_type}</span>
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
                      👤 <strong>Responsable:</strong> {task.profiles?.first_name} {task.profiles?.last_name} 
                      <span className="mx-2">|</span> 📱 <strong>Redes:</strong> {task.networks.join(', ')}
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <p className="text-gray-500">Borrador: <span className="font-bold text-red-600">{task.draft_date.split('-').reverse().join('/')}</span></p>
                      <p className="text-gray-500">Publicar: <span className="font-bold text-green-600">{task.post_date.split('-').reverse().join('/')}</span></p>
                      {task.canva_url && (
                        <a href={task.canva_url} target="_blank" rel="noreferrer" className="text-purple-600 hover:underline flex items-center gap-1 font-medium">
                          Link Canva <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* FLUJO DE BOTONES ESTRICTO */}
                  <div className="w-full md:w-auto flex flex-col gap-2">
                    
                    {/* Botones para el Diseñador */}
                    {isMyTask && (task.status === 'Pendiente' || task.status === 'Observado') && (
                      <button 
                        onClick={() => executeAction(task.id, 'En Revisión')}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
                      >
                        <Send size={16} /> Enviar a Revisión
                      </button>
                    )}

                    {isMyTask && task.status === 'En Revisión' && (
                      <p className="text-sm text-blue-600 font-medium text-center bg-blue-50 py-2 px-4 rounded-lg">Esperando revisión...</p>
                    )}

                    {/* Botones para el Supervisor */}
                    {isSupervisor && task.status === 'En Revisión' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => executeAction(task.id, 'Observado')}
                          className="flex items-center gap-1 bg-white border border-orange-400 text-orange-600 hover:bg-orange-50 font-bold py-2 px-3 rounded-lg transition text-sm"
                        >
                          <Edit3 size={14} /> Observar
                        </button>
                        <button 
                          onClick={() => executeAction(task.id, 'Publicado')}
                          className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded-lg transition text-sm"
                        >
                          <CheckCircle2 size={14} /> Aprobar
                        </button>
                      </div>
                    )}

                    {/* Terminó el flujo */}
                    {task.status === 'Publicado' && (
                      <p className="text-sm text-green-600 font-bold text-center bg-green-50 py-2 px-4 rounded-lg flex items-center justify-center gap-1">
                        <CheckCircle2 size={16} /> Listo
                      </p>
                    )}

                    {/* Etiqueta de métrica oculta */}
                    {task.real_delivery_date && isSupervisor && (
                      <p className="text-[10px] text-gray-400 text-center mt-1">
                        Entregó el: {new Date(task.real_delivery_date).toLocaleDateString('es-PE')}
                      </p>
                    )}

                  </div>
                </div>
              );
            })}
            {visibleTasks.length === 0 && (
              <p className="text-center text-gray-500 p-8 border-2 border-dashed border-gray-200 rounded-xl">
                {isSupervisor ? 'No hay tareas asignadas aún.' : '¡Todo al día! No tienes tareas pendientes.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}