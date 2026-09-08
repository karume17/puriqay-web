import { useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

type CompleteProfileModalProps = {
  userId: string;
  onCompleted: () => void;
};

// Modal bloqueante de "Completado de Perfil Progresivo": se muestra cuando el
// registro simplificado (Register.tsx) dejó datos avanzados sin llenar. No tiene
// botón de cerrar a propósito — el usuario debe completarlo para usar la plataforma.
export default function CompleteProfileModal({ userId, onCompleted }: CompleteProfileModalProps) {
  const [loading, setLoading] = useState(false);

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationText, setLocationText] = useState('📍 Obtener mi ubicación actual');

  const [formData, setFormData] = useState({
    documentId: '', emergencyPhone: '', studyCenter: '', otherStudyCenter: '',
    career: '', address: '', medicalConditions: 'Ninguna', shirtSize: ''
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
          toast.error('Error al obtener ubicación. Asegúrate de darle permisos a tu navegador.');
          setLocationText('📍 Obtener mi ubicación actual');
        }
      );
    } else {
      toast.error('Tu navegador no soporta geolocalización.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const finalStudyCenter = formData.studyCenter === 'Otro' ? formData.otherStudyCenter : formData.studyCenter;

    const { error } = await supabase
      .from('profiles')
      .update({
        document_id: formData.documentId,
        emergency_phone: formData.emergencyPhone,
        study_center: finalStudyCenter,
        career: formData.career,
        address: formData.address,
        latitude: lat,
        longitude: lng,
        medical_conditions: formData.medicalConditions,
        shirt_size: formData.shirtSize,
      })
      .eq('id', userId);

    if (error) {
      toast.error('Error al guardar tus datos: ' + error.message);
    } else {
      toast.success('¡Perfil completado!');
      onCompleted();
    }
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 border-2 border-pq-cream-dark rounded-xl bg-pq-cream/30 focus:bg-white focus:border-pq-teal focus:ring-4 focus:ring-pq-teal/10 outline-none transition-all font-medium text-pq-ink";
  const labelClass = "block text-sm font-bold text-pq-teal-dark mb-2";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-pq-ink/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white p-8 md:p-12 rounded-3xl shadow-2xl border border-pq-cream-dark my-8">

        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-pq-teal-deep flex items-center justify-center gap-2">
            Completa tu Perfil <span className="w-2.5 h-2.5 rounded-full bg-pq-marku mt-2"></span>
          </h2>
          <p className="text-pq-teal-dark/70 font-bold uppercase tracking-widest text-xs mt-2">Nos falta un poco de información</p>
          <p className="text-pq-ink/70 font-medium text-sm mt-4">Antes de continuar, necesitamos estos datos para poder coordinar contigo en las jornadas.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>DNI</label><input type="text" name="documentId" required maxLength={8} value={formData.documentId} onChange={handleChange} className={inputClass} /></div>
            <div><label className={labelClass}>Celular de Emergencia</label><input type="tel" name="emergencyPhone" required maxLength={9} value={formData.emergencyPhone} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Centro de Estudios</label>
              <select name="studyCenter" required value={formData.studyCenter} onChange={handleChange} className={inputClass}>
                <option value="">Selecciona una opción</option>
                <option value="UNMSM">UNMSM</option>
                <option value="UNI">UNI</option>
                <option value="PUCP">PUCP</option>
                <option value="UPC">UPC</option>
                <option value="ULima">Universidad de Lima</option>
                <option value="Otro">Otro</option>
              </select>
              {formData.studyCenter === 'Otro' && (
                <input type="text" name="otherStudyCenter" placeholder="Escribe tu centro de estudios" required value={formData.otherStudyCenter} onChange={handleChange} className={`${inputClass} mt-3`} />
              )}
            </div>
            <div><label className={labelClass}>Carrera / Profesión</label><input type="text" name="career" required value={formData.career} onChange={handleChange} className={inputClass} /></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Dirección Exacta</label><input type="text" name="address" required value={formData.address} onChange={handleChange} className={inputClass} /></div>
            <div className="flex flex-col justify-end">
              <button type="button" onClick={handleGetLocation} className={`w-full py-3 px-4 rounded-xl font-bold transition-all border-2 ${
                lat ? 'bg-pq-teal/10 text-pq-teal-dark border-pq-teal/30 shadow-sm' : 'bg-pq-cream/50 text-pq-ink/60 border-pq-cream-dark hover:bg-pq-cream hover:text-pq-teal-dark'
              }`}>
                {locationText}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label className={labelClass}>Alergias / Condiciones Médicas</label><input type="text" name="medicalConditions" required value={formData.medicalConditions} onChange={handleChange} className={inputClass} /></div>
            <div>
              <label className={labelClass}>Talla de Polo / Chaleco</label>
              <select name="shirtSize" required value={formData.shirtSize} onChange={handleChange} className={inputClass}>
                <option value="">Selecciona tu talla</option>
                <option value="S">S</option>
                <option value="M">M</option>
                <option value="L">L</option>
                <option value="XL">XL</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-dashed border-pq-cream-dark mt-4">
            <button type="submit" disabled={loading} className="w-full bg-pq-teal hover:bg-pq-teal-dark text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-pq-teal/30 hover:-translate-y-0.5 transition-all duration-200">
              {loading ? 'Guardando...' : 'Guardar y Continuar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
