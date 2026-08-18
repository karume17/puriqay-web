import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Project = {
  id: string;
  name: string;
  action_line: string;
  status: string;
  created_at: string;
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Estados del formulario
  const [formData, setFormData] = useState({
    name: '',
    actionLine: 'Animalista',
    objective: '',
    description: '',
    status: 'ACTIVO'
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, action_line, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al cargar proyectos:', error.message);
    } else {
      setProjects(data || []);
    }
    setFetching(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('projects')
      .insert([
        {
          name: formData.name,
          action_line: formData.actionLine,
          objective: formData.objective,
          description: formData.description,
          status: formData.status
        }
      ]);

    if (error) {
      alert('Error al crear el proyecto: ' + error.message);
    } else {
      alert('¡Proyecto creado con éxito!');
      // Limpiamos el formulario (dejamos valores por defecto)
      setFormData({ ...formData, name: '', objective: '', description: '' }); 
      // Recargamos la lista para ver el nuevo proyecto
      fetchProjects(); 
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8">
      {/* SECCIÓN 1: FORMULARIO DE CREACIÓN */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Crear Nuevo Proyecto</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Proyecto</label>
              <input type="text" name="name" value={formData.name} required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Voluntariado de Verano" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Línea de Acción</label>
              <select name="actionLine" value={formData.actionLine} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="Animalista">Animalista</option>
                <option value="Ambiental">Ambiental</option>
                <option value="Social">Social</option>
                <option value="Educativo">Educativo</option>
                <option value="Salud">Salud</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Objetivo General</label>
              <textarea name="objective" value={formData.objective} onChange={handleChange} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="¿Qué buscamos lograr?"></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Breve</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Detalles extra del proyecto..."></textarea>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado Inicial</label>
              <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="ACTIVO">ACTIVO</option>
                <option value="PAUSADO">PAUSADO</option>
                <option value="FINALIZADO">FINALIZADO</option>
              </select>
            </div>
            <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-200 mt-5">
              {loading ? 'Guardando...' : 'Guardar Proyecto'}
            </button>
          </div>
        </form>
      </div>

      {/* SECCIÓN 2: LISTA DE PROYECTOS */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Proyectos Actuales</h2>
        {fetching ? (
          <p className="text-gray-500">Cargando proyectos...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-3 border-b rounded-tl-lg">Nombre del Proyecto</th>
                  <th className="p-3 border-b">Línea de Acción</th>
                  <th className="p-3 border-b">Fecha de Creación</th>
                  <th className="p-3 border-b rounded-tr-lg">Estado</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj) => (
                  <tr key={proj.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 border-b font-medium text-gray-800">{proj.name}</td>
                    <td className="p-3 border-b text-gray-600">{proj.action_line}</td>
                    <td className="p-3 border-b text-gray-600">
                      {new Date(proj.created_at).toLocaleDateString('es-PE')}
                    </td>
                    <td className="p-3 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        proj.status === 'ACTIVO' ? 'bg-green-100 text-green-700' : 
                        proj.status === 'PAUSADO' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {proj.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {projects.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-gray-500">Aún no hay proyectos registrados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}