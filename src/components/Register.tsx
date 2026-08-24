import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('📍 Obtener mi ubicación actual');

  const [formData, setFormData] = useState({
    email: '', password: '', firstName: '', lastName: '', documentId: '',
    birthDate: '', phone: '', emergencyPhone: '', studyCenter: '',
    otherStudyCenter: '', career: '', address: '', medicalConditions: 'Ninguna', shirtSize: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      setLocationText('Obteniendo...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setLocationText('✅ Ubicación guardada');
        },
        () => {
          alert('Error al obtener ubicación. Asegúrate de darle permisos a tu navegador.');
          setLocationText('📍 Obtener mi ubicación actual');
        }
      );
    } else {
      alert('Tu navegador no soporta geolocalización.');
    }
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
      const finalStudyCenter = formData.studyCenter === 'Otro' ? formData.otherStudyCenter : formData.studyCenter;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          document_id: formData.documentId,
          birth_date: formData.birthDate,
          phone: formData.phone,
          emergency_phone: formData.emergencyPhone,
          study_center: finalStudyCenter,
          career: formData.career,
          address: formData.address,
          latitude: lat,
          longitude: lng,
          medical_conditions: formData.medicalConditions,
          shirt_size: formData.shirtSize
        })
        .eq('id', authData.user.id);

      if (profileError) {
        setErrorMsg('Usuario creado, pero hubo un error al guardar los datos personales.');
      } else {
        alert('¡Registro exitoso! Bienvenido a Puriqay.');
        navigate('/dashboard'); 
      }
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:bg-white focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none transition-all font-medium text-pq-ink";
  const labelClass = "block text-sm font-bold text-pq-teal-dark mb-2";

  return (
    <div className="min-h-screen bg-pq-cream py-10 px-4 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-pq-cream-dark">
        
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-black text-pq-teal-deep flex items-center justify-center gap-2">
            Únete a Puriqay <span className="w-2.5 h-2.5 rounded-full bg-pq-marku mt-2"></span>
          </h2>
          <p className="text-pq-teal-dark/70 font-bold uppercase tracking-widest text-xs mt-2">Completa tus datos para ser voluntario</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Nombres</label><input type="text" name="firstName" required onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Apellidos</label><input type="text" name="lastName" required onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Correo Electrónico</label><input type="email" name="email" required onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Contraseña <span className="text-xs font-medium text-pq-ink/50">(Mín. 6)</span></label><input type="password" name="password" required minLength={6} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>DNI</label><input type="text" name="documentId" required maxLength={8} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Fecha de Nacimiento</label><input type="date" name="birthDate" required onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Tu Celular <span className="text-xs font-medium text-pq-ink/50">(9 números)</span></label><input type="tel" name="phone" required maxLength={9} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Celular de Emergencia</label><input type="tel" name="emergencyPhone" required maxLength={9} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Centro de Estudios</label>
              <select name="studyCenter" required onChange={handleChange} className={inputClass}>
                <option value="">Selecciona una opción</option>
                <option value="UNMSM">UNMSM</option>
                <option value="UNI">UNI</option>
                <option value="PUCP">PUCP</option>
                <option value="UPC">UPC</option>
                <option value="ULima">Universidad de Lima</option>
                <option value="Otro">Otro</option>
              </select>
              {formData.studyCenter === 'Otro' && (
                <input type="text" name="otherStudyCenter" placeholder="Escribe tu centro de estudios" required onChange={handleChange} className={`${inputClass} mt-3`} />
              )}
            </div>
            <div><label className={labelClass}>Carrera / Profesión</label><input type="text" name="career" required onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Dirección Exacta</label><input type="text" name="address" required onChange={handleChange} className={inputClass} /></div>
            <div className="flex flex-col justify-end">
              <button type="button" onClick={handleGetLocation} className={`w-full py-3 px-4 rounded-xl font-bold transition-all border-2 ${
                lat ? 'bg-pq-teal/10 text-pq-teal-dark border-pq-teal/30 shadow-sm' : 'bg-pq-cream/50 text-pq-ink/60 border-pq-cream-dark hover:bg-pq-cream hover:text-pq-teal-dark'
              }`}>
                {locationText}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Alergias / Condiciones Médicas</label><input type="text" name="medicalConditions" defaultValue="Ninguna" onChange={handleChange} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Talla de Polo / Chaleco</label>
              <select name="shirtSize" required onChange={handleChange} className={inputClass}>
                <option value="">Selecciona tu talla</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
          </div>

          {errorMsg && <div className="bg-red-50 text-red-600 text-sm text-center font-bold p-3 rounded-xl border border-red-100">{errorMsg}</div>}

          <div className="pt-4 border-t-2 border-dashed border-pq-cream-dark mt-8">
            <button type="submit" disabled={loading} className="w-full bg-pq-teal hover:bg-pq-teal-dark text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-pq-teal/30 hover:-translate-y-0.5 transition-all duration-200">
              {loading ? 'Procesando registro...' : 'Completar Registro'}
            </button>
          </div>
          
          <p className="text-center text-sm text-pq-ink/70 mt-6 font-medium">
            ¿Ya tienes una cuenta? <Link to="/" className="text-pq-teal font-black hover:text-pq-teal-dark transition-colors hover:underline">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}