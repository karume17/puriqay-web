import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mail, Lock, UserPlus, ArrowRight, Sun, Mountain, Leaf, BookOpen, KeyRound } from 'lucide-react';
import { traducirErrorAuth } from '../lib/authErrors';

// Rayitas dibujadas a mano que acompañan al título y al botón
const Rays = ({ side }: { side: 'l' | 'r' }) => (
  <svg className={`nb-rays nb-rays--${side}`} viewBox="0 0 40 44" aria-hidden="true">
    <path d="M6 6 L18 14 M2 22 L16 22 M6 38 L18 30" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();

  // Con la sesión ya abierta, el login no tiene nada que hacer: directo al panel.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
    });
  }, [navigate]);

  // Si la cuenta existe pero el correo no está confirmado, se puede pedir otro enlace.
  const handleResend = async () => {
    setResending(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResending(false);
    if (error) toast.error(traducirErrorAuth(error));
    else toast.success('Te reenviamos el correo de confirmación. Revisa tu bandeja y el spam.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setNeedsConfirmation(false);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(traducirErrorAuth(error));
      setNeedsConfirmation(error.code === 'email_not_confirmed' || /email not confirmed/i.test(error.message));
    } else {
      // replace: el login sale del historial y "Atrás" desde el panel no vuelve aquí.
      navigate('/dashboard', { replace: true });
    }

    setLoading(false);
  };

  return (
    <div className="nb-scope nb-desk">
      {/* Filtros SVG: bordes rasgados del papel y tinta irregular del sello */}
      <svg className="nb-defs" width="0" height="0" aria-hidden="true" focusable="false">
        <filter id="nb-rough" x="-5%" y="-15%" width="110%" height="130%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="5" />
        </filter>
        <filter id="nb-ink" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="2" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </svg>

      <main className="nb-book">
        {/* ===== Tapa ===== */}
        <aside className="nb-cover">
          <div className="nb-logo">
            <img src="/img/puriqay-p-blanca.png" alt="" />
            <span>Puriqay</span>
          </div>

          <svg className="nb-trail" viewBox="0 0 220 130" aria-hidden="true">
            <path d="M6 118 C 40 70, 10 40, 70 52 S 140 30, 160 56 S 190 40, 206 22" />
          </svg>
          <Mountain className="nb-mount" aria-hidden="true" />
          <div className="nb-route">
            Personas que<br />cuidan territorios
          </div>

          <Leaf className="nb-leaf nb-leaf--a" aria-hidden="true" />
          <Leaf className="nb-leaf nb-leaf--b" aria-hidden="true" />

          <img className="nb-marku" src="/img/marku-mapa.png" alt="Marku, la mascota de Puriqay, con un mapa" />
          <div className="nb-slogan">
            Juntos por un<br />mejor mañana.
          </div>
        </aside>

        {/* ===== Página ===== */}
        <section className="nb-page">
          {/* Pestañas-separador de arriba: solo decoración, no se pueden tocar */}
          <div className="nb-tabs" aria-hidden="true" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <span className="nb-tab nb-tab--ingresar">
              <BookOpen size={17} /> Ingresar
            </span>
            <span className="nb-tab nb-tab--registro">
              <UserPlus size={17} /> Misiones
            </span>
            <span className="nb-tab nb-tab--clave">
              <KeyRound size={17} /> Rutas
            </span>
          </div>

          {/* Pestañas decorativas del borde derecho */}
          <div className="nb-side" aria-hidden="true">
            <span className="nb-side-t nb-side-t--a">Voluntariado</span>
            <span className="nb-side-t nb-side-t--b">Puriqay</span>
          </div>

          <Sun className="nb-sun" aria-hidden="true" />

          <div className="nb-head">
            <h1 className="nb-title">
              <Rays side="l" />
              ¡Abre tu<br />Bitácora!
              <Rays side="r" />
            </h1>
            <p className="nb-sub">Suma tu huella. El impacto empieza en esta página.</p>
          </div>

          <form onSubmit={handleLogin}>
            <label className="nb-tag">
              <div className="nb-paper">
                <span className="nb-lbl"><Mail size={18} aria-hidden="true" /> Correo electrónico</span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>
            </label>

            <label className="nb-tag nb-tag--r">
              <div className="nb-paper">
                <span className="nb-lbl"><Lock size={18} aria-hidden="true" /> Contraseña</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </label>

            <Link to="/forgot-password" className="nb-forgot">
              ¿Olvidaste tu contraseña?
            </Link>

            {errorMsg && (
              <div className="nb-error" role="alert">
                {errorMsg}
                {needsConfirmation && (
                  <button type="button" onClick={handleResend} disabled={resending} className="nb-linkbtn">
                    {resending ? 'Enviando...' : 'Reenviar correo de confirmación'}
                  </button>
                )}
              </div>
            )}

            <div className="nb-stamp-wrap">
              <Rays side="l" />
              <button type="submit" disabled={loading} className="nb-stamp">
                <img src="/img/puriqay-p-circulo.png" alt="" />
                <span className="nb-sep" aria-hidden="true" />
                {loading ? 'Sellando...' : 'Sellar pasaporte'}
              </button>
              <Rays side="r" />
            </div>
          </form>

          <div className="nb-or">o</div>
          <Link to="/register" className="nb-swap">
            <UserPlus size={28} aria-hidden="true" />
            <span className="nb-swap-t">
              <small>¿Aún no tienes tu pasaporte?</small>
              <b>Súmate aquí</b>
            </span>
            <ArrowRight size={22} aria-hidden="true" />
          </Link>

          <Leaf className="nb-pleaf" aria-hidden="true" />
        </section>
      </main>
    </div>
  );
}