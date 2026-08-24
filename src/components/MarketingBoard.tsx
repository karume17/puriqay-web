import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Clock, CheckCircle, ExternalLink, Send, Edit3, CheckCircle2 } from 'lucide-react';

export default function MarketingBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) setUserRole(profile.role);
    }

    const { data: teamData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, area')
      .in('role', ['ADMIN', 'COORDINADOR'])
      .eq('area', 'Comunicación y Difusión');
    if (teamData) setTeam(teamData);

    const { data: taskData } = await supabase
      .from('marketing_tasks')
      .select('*, profiles(first_name, last_name)')
      .order('post_date', { ascending: true });
    
    if (taskData) setTasks(taskData);
    setFetching(false);
  };

  const handlePostDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pDate = e.target.value;
    setPostDate(pDate);
    if (pDate) {
      const dateObj = new Date(pDate + 'T12:00:00');
      dateObj.setDate(dateObj.getDate() - 7);
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
      title, content_type: contentType, assigned_to: assignedTo,
      networks: selectedNetworks, canva_url: canvaUrl || null,
      draft_date: draftDate, post_date: postDate, status: 'Pendiente'
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

  const executeAction = async (id: string, newStatus: string) => {
    const payload: any = { status: newStatus };
    if (newStatus === 'En Revisión') payload.real_delivery_date = new Date().toISOString();
    await supabase.from('marketing_tasks').update(payload).eq('id', id);
    fetchData();
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

  const isSupervisor = userRole === 'ADMIN';
  const visibleTasks = isSupervisor ? tasks : tasks.filter(t => t.assigned_to === userId);

  return (
    <div className="space-y-8">
      
      {isSupervisor && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-pq-cream-dark shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-black text-pq-teal-deep flex items-center gap-2">
              Asignar Nueva Tarea <span className="w-2 h-2 rounded-full bg-pq-marku inline-block"></span>
            </h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-bold text-pq-teal-dark mb-2">Título de la Campaña <span className="text-red-500">*</span></label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none font-medium text-pq-ink transition-all" placeholder="Ej: Fiestas Patrias" />
              </div>
              <div>
                <label className="block text-sm font-bold text-pq-teal-dark mb-2">Tipo de Contenido <span className="text-red-500">*</span></label>
                <select required value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none font-medium text-pq-ink transition-all">
                  <option value="Post">Post (Imagen estática)</option>
                  <option value="Carrusel">Carrusel</option>
                  <option value="Reel">Reel / Video corto</option>
                  <option value="Historia">Historia (Story)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-pq-teal-dark mb-2">Asignar a <span className="text-red-500">*</span></label>
                <select required value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none font-medium text-pq-ink transition-all">
                  <option value="">-- Selecciona Diseñador --</option>
                  {team.map(member => (
                    <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-pq-cream/30 p-4 rounded-xl border border-pq-cream-dark">
                <label className="block text-sm font-bold text-pq-teal-dark mb-3">Redes Sociales (Destino) <span className="text-red-500">*</span></label>
                <div className="flex flex-wrap gap-5">
                  {Object.keys(networks).map(net => (
                    <label key={net} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" checked={networks[net as keyof typeof networks]} onChange={() => handleNetworkChange(net)} className="w-5 h-5 text-pq-teal border-2 border-pq-cream-dark rounded focus:ring-pq-teal" />
                      <span className="text-sm font-bold text-pq-ink/80 group-hover:text-pq-teal transition-colors">{net}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-pq-teal-dark mb-2">Carpeta / Link de Canva</label>
                <input type="url" value={canvaUrl} onChange={(e) => setCanvaUrl(e.target.value)} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none font-medium text-pq-ink transition-all" placeholder="https://canva.com/..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t-2 border-dashed border-pq-cream-dark pt-5">
              <div>
                <label className="block text-sm font-bold text-pq-teal-dark mb-2">Fecha de PUBLICACIÓN <span className="text-red-500">*</span></label>
                <input type="date" required value={postDate} onChange={handlePostDateChange} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none font-medium text-pq-ink transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-pq-teal-dark mb-2 flex justify-between">Límite de ENTREGA <span className="text-xs text-pq-marku">(-7 días auto)</span></label>
                <input type="date" readOnly value={draftDate} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/50 text-pq-ink/50 outline-none cursor-not-allowed font-medium" />
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button type="submit" disabled={loading} className="bg-pq-teal hover:bg-pq-teal-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-pq-teal/30 hover:-translate-y-0.5 transition-all duration-200">
                {loading ? 'Guardando...' : 'Asignar Tarea'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TABLERO */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-pq-cream-dark shadow-sm">
        <h2 className="text-2xl font-black text-pq-teal-deep mb-6 flex items-center gap-2">
          {isSupervisor ? 'Todas las Tareas' : 'Mis Tareas Asignadas'} <span className="w-2 h-2 rounded-full bg-pq-marku inline-block"></span>
        </h2>
        
        {fetching ? <div className="flex justify-center p-8"><p className="text-pq-teal-dark font-medium animate-pulse">Cargando tablero...</p></div> : (
          <div className="grid grid-cols-1 gap-5">
            {visibleTasks.map(task => {
              const alert = getAlertStatus(task.draft_date, task.status);
              const isMyTask = task.assigned_to === userId;
              
              return (
                <div key={task.id} className={`border-2 rounded-2xl p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center transition-all shadow-sm ${
                  task.status === 'Publicado' ? 'bg-pq-cream/20 border-pq-cream-dark' : 'bg-white border-pq-cream-dark hover:border-pq-teal/40 hover:shadow-md'
                }`}>
                  
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                        task.status === 'Pendiente' ? 'bg-gray-100 text-gray-600' :
                        task.status === 'En Revisión' ? 'bg-blue-100 text-blue-700' :
                        task.status === 'Observado' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {task.status}
                      </span>
                      <span className="bg-pq-teal/10 text-pq-teal-dark text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-pq-teal/20">{task.content_type}</span>
                      <h3 className="font-black text-xl text-pq-teal-deep">{task.title}</h3>
                      {alert && (
                        <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wider ${
                          alert.type === 'red' ? 'bg-red-100 text-red-700 border-red-300' : 
                          alert.type === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 
                          'bg-green-100 text-green-700 border-green-300'
                        }`}>
                          <alert.icon size={12} /> {alert.text}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm text-pq-ink/80 mb-3 font-medium flex items-center gap-2">
                      <span className="bg-pq-cream px-2 py-1 rounded-md">👤 {task.profiles?.first_name} {task.profiles?.last_name}</span>
                      <span className="bg-pq-cream px-2 py-1 rounded-md">📱 {task.networks.join(', ')}</span>
                    </p>
                    
                    <div className="flex flex-wrap gap-4 text-sm bg-pq-cream/30 p-3 rounded-xl border border-pq-cream-dark w-fit">
                      <p className="text-pq-teal-dark font-medium">Borrador: <span className="font-black text-red-500 ml-1">{task.draft_date.split('-').reverse().join('/')}</span></p>
                      <p className="text-pq-teal-dark font-medium border-l-2 border-pq-cream-dark pl-4">Publicar: <span className="font-black text-pq-teal ml-1">{task.post_date.split('-').reverse().join('/')}</span></p>
                      {task.canva_url && (
                        <a href={task.canva_url} target="_blank" rel="noreferrer" className="text-pq-teal-deep hover:text-pq-teal font-black flex items-center gap-1 border-l-2 border-pq-cream-dark pl-4 transition-colors">
                          Ver Canva <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex flex-col gap-2 min-w-[160px]">
                    
                    {isMyTask && (task.status === 'Pendiente' || task.status === 'Observado') && (
                      <button onClick={() => executeAction(task.id, 'En Revisión')} className="flex items-center justify-center gap-2 bg-pq-teal hover:bg-pq-teal-dark text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-pq-teal/20 hover:-translate-y-0.5">
                        <Send size={16} /> Enviar a Revisión
                      </button>
                    )}

                    {isMyTask && task.status === 'En Revisión' && (
                      <p className="text-sm text-blue-600 font-bold text-center bg-blue-50 py-2.5 px-4 rounded-xl border border-blue-100">Esperando revisión...</p>
                    )}

                    {isSupervisor && task.status === 'En Revisión' && (
                      <div className="flex gap-2">
                        <button onClick={() => executeAction(task.id, 'Observado')} className="flex-1 flex justify-center items-center gap-1 bg-white border-2 border-orange-400 text-orange-600 hover:bg-orange-50 font-bold py-2 px-3 rounded-xl transition-colors text-sm">
                          <Edit3 size={16} /> Observar
                        </button>
                        <button onClick={() => executeAction(task.id, 'Publicado')} className="flex-1 flex justify-center items-center gap-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-3 rounded-xl transition-all shadow-md shadow-green-500/20 text-sm">
                          <CheckCircle2 size={16} /> Aprobar
                        </button>
                      </div>
                    )}

                    {task.status === 'Publicado' && (
                      <p className="text-sm text-green-600 font-black text-center bg-green-50 py-2.5 px-4 rounded-xl flex items-center justify-center gap-1 border border-green-200">
                        <CheckCircle2 size={18} /> Listo
                      </p>
                    )}

                    {task.real_delivery_date && isSupervisor && (
                      <p className="text-[10px] font-bold text-pq-teal-dark/60 text-center mt-1 uppercase tracking-wider">
                        Entregó el: {new Date(task.real_delivery_date).toLocaleDateString('es-PE')}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            {visibleTasks.length === 0 && (
              <p className="text-center text-pq-teal-dark font-medium p-10 border-2 border-dashed border-pq-cream-dark rounded-3xl bg-pq-cream/30">
                {isSupervisor ? 'No hay tareas asignadas aún.' : '¡Todo al día! No tienes tareas pendientes.'}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}