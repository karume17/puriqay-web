import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, Clock, CheckCircle, ExternalLink, Send, Edit3, CheckCircle2, Hourglass, Archive, CalendarPlus, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import MarketingCalendar from './MarketingCalendar';

type MarketingTask = {
  id: string;
  created_at: string;
  title: string;
  content_type: string;
  assigned_to: string;
  networks: string[];
  description: string | null;
  references: string[] | null;
  submission_link: string | null;
  draft_date: string;
  post_date: string;
  real_delivery_date: string | null;
  extension_days: number;
  is_active: boolean;
  status: string;
  profiles: { first_name: string; last_name: string } | null;
};

type TeamMember = {
  id: string;
  first_name: string;
  last_name: string;
  area: string;
};

const emptyNetworks = { Facebook: false, Instagram: false, TikTok: false, LinkedIn: false };
const emptyReferences = ['', '', ''];

export default function MarketingBoard() {
  const [tasks, setTasks] = useState<MarketingTask[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [contentType, setContentType] = useState('Post');
  const [assignedTo, setAssignedTo] = useState('');
  const [description, setDescription] = useState('');
  const [references, setReferences] = useState<string[]>(emptyReferences);
  const [draftDate, setDraftDate] = useState('');
  const [postDate, setPostDate] = useState('');

  const [networks, setNetworks] = useState(emptyNetworks);

  // Modal de envío a revisión: el asignado debe pegar el link de su entregable
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitTaskId, setSubmitTaskId] = useState('');
  const [submissionLinkInput, setSubmissionLinkInput] = useState('');

  // Al hacer clic en una tarea del calendario, hacemos scroll hasta su tarjeta
  // en el tablero y la resaltamos brevemente.
  const taskRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);

  const handleSelectFromCalendar = (id: string) => {
    const el = taskRefs.current[id];
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHighlightedTaskId(id);
    setTimeout(() => setHighlightedTaskId(prev => (prev === id ? null : prev)), 2000);
  };

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
      .eq('is_active', true)
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

  const handleReferenceChange = (index: number, value: string) => {
    setReferences(prev => prev.map((r, i) => (i === index ? value : r)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const selectedNetworks = Object.keys(networks).filter(n => networks[n as keyof typeof networks]);
    if (selectedNetworks.length === 0) {
      toast.error('Debes seleccionar al menos una red social.');
      setLoading(false);
      return;
    }

    const cleanReferences = references.map(r => r.trim()).filter(Boolean).slice(0, 3);

    const { error } = await supabase.from('marketing_tasks').insert([{
      title, content_type: contentType, assigned_to: assignedTo,
      networks: selectedNetworks, description: description.trim() || null,
      references: cleanReferences.length > 0 ? cleanReferences : null,
      draft_date: draftDate, post_date: postDate, status: 'Pendiente'
    }]);

    if (error) {
      toast.error('Error al crear tarea: ' + error.message);
    } else {
      toast.success('¡Tarea asignada con éxito!');
      setTitle(''); setDescription(''); setReferences(emptyReferences); setDraftDate(''); setPostDate('');
      setNetworks(emptyNetworks);
      fetchData();
    }
    setLoading(false);
  };

  const executeAction = async (id: string, newStatus: string) => {
    await supabase.from('marketing_tasks').update({ status: newStatus }).eq('id', id);
    fetchData();
  };

  const openSubmitModal = (id: string) => {
    setSubmitTaskId(id);
    setSubmissionLinkInput('');
    setShowSubmitModal(true);
  };

  const handleSubmitForReview = async () => {
    if (!submissionLinkInput.trim()) {
      toast.error('Debes pegar el link de tu entregable.');
      return;
    }

    const { error } = await supabase.from('marketing_tasks').update({
      status: 'En Revisión',
      real_delivery_date: new Date().toISOString(),
      submission_link: submissionLinkInput.trim(),
    }).eq('id', submitTaskId);

    if (error) {
      toast.error('Error al enviar a revisión: ' + error.message);
    } else {
      toast.success('¡Enviado a revisión!');
      setShowSubmitModal(false);
      fetchData();
    }
  };

  const extendDeadline = async (task: MarketingTask) => {
    const newDraftDate = new Date(task.draft_date + 'T12:00:00');
    newDraftDate.setDate(newDraftDate.getDate() + 1);

    const { error } = await supabase.from('marketing_tasks').update({
      extension_days: task.extension_days + 1,
      draft_date: newDraftDate.toISOString().split('T')[0],
    }).eq('id', task.id);

    if (error) {
      toast.error('Error al extender el plazo: ' + error.message);
    } else {
      toast.success('Plazo extendido 1 día.');
      fetchData();
    }
  };

  const archiveTask = async (id: string) => {
    if (!confirm('¿Archivar esta tarea? Ya no aparecerá en el tablero.')) return;

    const { error } = await supabase.from('marketing_tasks').update({ is_active: false }).eq('id', id);
    if (error) {
      toast.error('Error al archivar la tarea: ' + error.message);
    } else {
      toast.success('Tarea archivada.');
      fetchData();
    }
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

  // Genera la URL del template de Google Calendar (sin usar ninguna API):
  // https://calendar.google.com/calendar/render?action=TEMPLATE
  // post_date es un evento de todo el día, así que "dates" necesita el
  // día siguiente como fin exclusivo (formato YYYYMMDD/YYYYMMDD).
  const buildGoogleCalendarUrl = (task: MarketingTask) => {
    const start = task.post_date.replace(/-/g, '');
    const endDateObj = new Date(task.post_date + 'T12:00:00');
    endDateObj.setDate(endDateObj.getDate() + 1);
    const end = `${endDateObj.getFullYear()}${String(endDateObj.getMonth() + 1).padStart(2, '0')}${String(endDateObj.getDate()).padStart(2, '0')}`;

    const detailsParts = [
      task.description || '',
      task.references && task.references.length > 0 ? `Referencias:\n${task.references.join('\n')}` : '',
      task.submission_link ? `Entregable: ${task.submission_link}` : '',
    ].filter(Boolean);

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `[${task.content_type}] ${task.title}`,
      dates: `${start}/${end}`,
      details: detailsParts.join('\n\n'),
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
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

            <div>
              <label className="block text-sm font-bold text-pq-teal-dark mb-2">Descripción</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:bg-white focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none transition-all font-medium text-pq-ink resize-none" placeholder="¿Qué debe incluir esta pieza?"></textarea>
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
                <label className="block text-sm font-bold text-pq-teal-dark mb-2">Referencias <span className="text-xs text-pq-ink/50 font-medium">(máx. 3 links, opcional)</span></label>
                <div className="space-y-2">
                  {references.map((ref, i) => (
                    <input key={i} type="url" value={ref} onChange={(e) => handleReferenceChange(i, e.target.value)} className="w-full px-4 py-2.5 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none font-medium text-pq-ink transition-all" placeholder={`Link de referencia ${i + 1}`} />
                  ))}
                </div>
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

      {/* CALENDARIO INTERNO */}
      <MarketingCalendar tasks={visibleTasks} onSelectTask={handleSelectFromCalendar} />

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
                <div
                  key={task.id}
                  ref={(el) => { taskRefs.current[task.id] = el; }}
                  className={`border-2 rounded-2xl p-5 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center transition-all shadow-sm ${
                    highlightedTaskId === task.id ? 'ring-4 ring-pq-marku/40 border-pq-marku' :
                    task.status === 'Publicado' ? 'bg-pq-cream/20 border-pq-cream-dark' : 'bg-white border-pq-cream-dark hover:border-pq-teal/40 hover:shadow-md'
                  }`}
                >

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
                      {task.extension_days > 0 && (
                        <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border border-purple-300 bg-purple-100 text-purple-700 uppercase tracking-wider">
                          <Hourglass size={12} /> +{task.extension_days}d
                        </span>
                      )}
                    </div>

                    {task.description && (
                      <p className="text-sm text-pq-ink/70 font-medium mb-3">{task.description}</p>
                    )}

                    <p className="text-sm text-pq-ink/80 mb-3 font-medium flex items-center gap-2">
                      <span className="bg-pq-cream px-2 py-1 rounded-md">👤 {task.profiles?.first_name} {task.profiles?.last_name}</span>
                      <span className="bg-pq-cream px-2 py-1 rounded-md">📱 {task.networks.join(', ')}</span>
                    </p>

                    {task.references && task.references.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 max-w-md">
                        {task.references.map((ref, i) => (
                          <a
                            key={i}
                            href={ref}
                            target="_blank"
                            rel="noreferrer"
                            title={ref}
                            className="flex items-center gap-1.5 bg-pq-teal/5 border-2 border-pq-teal/20 rounded-xl px-3 py-2 hover:bg-pq-teal/10 hover:border-pq-teal/40 transition-colors"
                          >
                            <Link2 size={13} className="text-pq-teal-dark shrink-0" />
                            <span className="text-xs font-bold text-pq-teal-dark truncate">Referencia {i + 1}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm bg-pq-cream/30 p-3 rounded-xl border border-pq-cream-dark w-fit">
                      <p className="text-pq-teal-dark font-medium">Borrador: <span className="font-black text-red-500 ml-1">{task.draft_date.split('-').reverse().join('/')}</span></p>
                      <p className="text-pq-teal-dark font-medium border-l-2 border-pq-cream-dark pl-4">Publicar: <span className="font-black text-pq-teal ml-1">{task.post_date.split('-').reverse().join('/')}</span></p>
                      {task.submission_link && (
                        <a href={task.submission_link} target="_blank" rel="noreferrer" className="text-pq-teal-deep hover:text-pq-teal font-black flex items-center gap-1 border-l-2 border-pq-cream-dark pl-4 transition-colors">
                          Ver Entregable <ExternalLink size={14} />
                        </a>
                      )}
                    </div>

                    <a
                      href={buildGoogleCalendarUrl(task)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-pq-teal-dark hover:text-pq-teal-deep mt-3 hover:underline transition-colors"
                    >
                      <CalendarPlus size={14} /> Agregar a Google Calendar
                    </a>
                  </div>

                  <div className="w-full md:w-auto flex flex-col gap-2 min-w-[160px]">

                    {isMyTask && (task.status === 'Pendiente' || task.status === 'Observado') && (
                      <button onClick={() => openSubmitModal(task.id)} className="flex items-center justify-center gap-2 bg-pq-teal hover:bg-pq-teal-dark text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-md shadow-pq-teal/20 hover:-translate-y-0.5">
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

                    {isSupervisor && task.status !== 'Publicado' && (
                      <button onClick={() => extendDeadline(task)} className="flex items-center justify-center gap-1 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 font-bold py-2 px-3 rounded-xl transition-colors text-xs">
                        <Hourglass size={14} /> Extender +1 día
                      </button>
                    )}

                    {isSupervisor && (
                      <button onClick={() => archiveTask(task.id)} className="flex items-center justify-center gap-1 text-red-400 hover:text-red-600 hover:bg-red-50 font-bold py-2 px-3 rounded-xl transition-colors text-xs">
                        <Archive size={14} /> Archivar
                      </button>
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

      {/* MODAL DE ENVÍO A REVISIÓN */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-pq-ink/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 border border-pq-cream-dark">
            <h3 className="text-2xl font-black text-pq-teal-deep mb-2 flex items-center gap-2">
              Enviar a Revisión <span className="w-2 h-2 rounded-full bg-pq-marku inline-block"></span>
            </h3>
            <p className="text-sm text-pq-ink/70 mb-6 font-medium">Pega el link de tu entregable (Canva, Drive, etc.) para que el equipo lo revise.</p>
            <div>
              <label className="block text-sm font-bold text-pq-teal-dark mb-2">Link del Entregable <span className="text-red-500">*</span></label>
              <input type="url" value={submissionLinkInput} onChange={(e) => setSubmissionLinkInput(e.target.value)} className="w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:bg-white focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none transition-all font-medium text-pq-ink" placeholder="https://canva.com/..." />
            </div>
            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowSubmitModal(false)} className="px-5 py-2.5 text-pq-ink/70 font-bold hover:bg-pq-cream rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleSubmitForReview} className="px-5 py-2.5 bg-pq-teal text-white font-bold rounded-xl hover:bg-pq-teal-dark shadow-lg shadow-pq-teal/30 transition-all">Confirmar Envío</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
