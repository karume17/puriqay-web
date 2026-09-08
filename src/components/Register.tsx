import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Fase 1 del registro (fricción cero): solo lo mínimo para crear la cuenta.
// El resto de los datos del voluntario (DNI, contacto de emergencia, centro de
// estudios, dirección, tallas, etc.) se piden después mediante el modal de
// "Completado de Perfil Progresivo" en Dashboard.tsx la primera vez que inicia sesión.
export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', birthDate: '', phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          birth_date: formData.birthDate,
          phone: formData.phone,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        setErrorMsg('Usuario creado, pero hubo un error al guardar los datos personales.');
      } else {
        toast.success('¡Registro exitoso! Bienvenido a Puriqay.');
        navigate('/dashboard');
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:bg-white focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none transition-all font-medium text-pq-ink";
  const labelClass = "block text-sm font-bold text-pq-teal-dark mb-2";

  return (
    <div className="min-h-screen bg-pq-cream py-10 px-4 flex justify-center items-center">
      <div className="w-full max-w-lg bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-pq-cream-dark">

        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-pq-teal-deep flex items-center justify-center gap-2">
            Únete a Puriqay <span className="w-2.5 h-2.5 rounded-full bg-pq-marku mt-2"></span>
          </h2>
          <p className="text-pq-teal-dark/70 font-bold uppercase tracking-widest text-xs mt-2">Crea tu cuenta en un minuto</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Nombres</label><input type="text" name="firstName" required value={formData.firstName} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Apellidos</label><input type="text" name="lastName" required value={formData.lastName} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div>
            <label className={labelClass}>Correo Electrónico</label>
            <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>Contraseña <span className="text-xs font-medium text-pq-ink/50">(Mín. 6)</span></label>
            <input type="password" name="password" required minLength={6} value={formData.password} onChange={handleChange} className={inputClass} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" name="birthDate" required value={formData.birthDate} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Celular <span className="text-xs font-medium text-pq-ink/50">(9 números)</span></label><input type="tel" name="phone" required maxLength={9} value={formData.phone} onChange={handleChange} className={inputClass} /></div>
          </div>

          {errorMsg && <div className="bg-red-50 text-red-600 text-sm text-center font-bold p-3 rounded-xl border border-red-100">{errorMsg}</div>}

          <div className="pt-4 border-t-2 border-dashed border-pq-cream-dark mt-8">
            <button type="submit" disabled={loading} className="w-full bg-pq-teal hover:bg-pq-teal-dark text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-pq-teal/30 hover:-translate-y-0.5 transition-all duration-200">
              {loading ? 'Procesando registro...' : 'Completar Registro'}
            </button>
            <p className="text-center text-xs text-pq-ink/50 font-medium mt-3">Te pediremos algunos datos adicionales la primera vez que ingreses.</p>
          </div>

          <p className="text-center text-sm text-pq-ink/70 mt-6 font-medium">
            ¿Ya tienes una cuenta? <Link to="/" className="text-pq-teal font-black hover:text-pq-teal-dark transition-colors hover:underline">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
