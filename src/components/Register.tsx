import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Coordenadas
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('📍 Obtener mi ubicación actual');

  // Datos del formulario
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

    // 1. Creamos el usuario en Autenticación
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    // 2. Si se creó bien, actualizamos su perfil con los demás datos
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
        navigate('/dashboard'); // Los mandamos adentro
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4 flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">Únete a Puriqay</h2>
          <p className="text-gray-500 mt-2">Completa tus datos para ser voluntario</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {/* Fila 1: Nombres y Apellidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombres</label>
              <input type="text" name="firstName" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos</label>
              <input type="text" name="lastName" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Fila 2: Correo y Contraseña */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
              <input type="email" name="email" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (Mínimo 6 caracteres)</label>
              <input type="password" name="password" required minLength={6} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Fila 3: DNI y Fecha Nacimiento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">DNI</label>
              <input type="text" name="documentId" required maxLength={8} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Nacimiento</label>
              <input type="date" name="birthDate" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Fila 4: Celular y Contacto Emergencia */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu Celular (9 números)</label>
              <input type="tel" name="phone" required maxLength={9} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Celular de Emergencia</label>
              <input type="tel" name="emergencyPhone" required maxLength={9} onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Fila 5: Centro de estudios y Carrera */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Centro de Estudios</label>
              <select name="studyCenter" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Selecciona una opción</option>
                <option value="UNMSM">UNMSM</option>
                <option value="UNI">UNI</option>
                <option value="PUCP">PUCP</option>
                <option value="UPC">UPC</option>
                <option value="ULima">Universidad de Lima</option>
                <option value="Otro">Otro</option>
              </select>
              {formData.studyCenter === 'Otro' && (
                <input type="text" name="otherStudyCenter" placeholder="Escribe tu centro de estudios" required onChange={handleChange} className="w-full px-4 py-2 mt-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carrera / Profesión</label>
              <input type="text" name="career" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Fila 6: Dirección y GPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Exacta</label>
              <input type="text" name="address" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex flex-col justify-end">
              <button type="button" onClick={handleGetLocation} className={`w-full py-2 px-4 rounded-lg font-medium transition ${lat ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'}`}>
                {locationText}
              </button>
            </div>
          </div>

          {/* Fila 7: Salud y Talla */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alergias o Condiciones Médicas</label>
              <input type="text" name="medicalConditions" defaultValue="Ninguna" onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Talla de Polo / Chaleco</label>
              <select name="shirtSize" required onChange={handleChange} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Selecciona tu talla</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
          </div>

          {errorMsg && <p className="text-red-500 text-sm text-center font-medium">{errorMsg}</p>}

          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200">
            {loading ? 'Registrando...' : 'Completar Registro'}
          </button>
          
          <p className="text-center text-sm text-gray-600 mt-4">
            ¿Ya tienes una cuenta? <Link to="/" className="text-blue-600 hover:underline">Inicia sesión aquí</Link>
          </p>
        </form>
      </div>
    </div>
  );
}