import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  MailCheck, Mail, Lock, User, CalendarDays, Smartphone,
  BookOpen, UserPlus, Flag, KeyRound, ArrowRight, ArrowLeft, Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { PATTERNS, TITLES, birthDateLimits, limpiarNombre } from '../lib/validations';
import { traducirErrorAuth } from '../lib/authErrors';
import { usePageTurn, useTurnIn } from '../lib/pageTurn';
import type { TurnDir, TurnHandler } from '../lib/pageTurn';

// Rayitas dibujadas a mano que acompañan al título y al botón
const Rays = ({ side }: { side: 'l' | 'r' }) => (
  <svg className={`nb-rays nb-rays--${side}`} viewBox="0 0 40 44" aria-hidden="true">
    <path d="M6 6 L18 14 M2 22 L16 22 M6 38 L18 30" />
  </svg>
);

// Sol dibujado a mano (círculo irregular + rayitas)
const HandSun = () => (
  <svg className="nb-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 7.2 C14.8 7 17 9.2 16.9 12 C16.8 14.8 14.6 17 11.9 16.9 C9.2 16.8 7.1 14.6 7.2 11.9 C7.3 9.3 9.4 7.3 12 7.2Z" />
    <path d="M12 2 L12.2 4.2 M11.8 19.8 L12 22 M2 12 L4.2 11.8 M19.8 12.2 L22 12 M5 5 L6.5 6.5 M17.5 17.5 L19 19 M5 19 L6.5 17.5 M17.5 6.5 L19 5" />
  </svg>
);

// Ramita con hojas dibujadas (esquina de la hoja y de la página izquierda)
const PageLeaves = ({ className = 'nb-pleaf' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 78 C24 55 36 35 56 14" />
    <path d="M28 60 C16 56 12 46 14 38 C24 40 30 48 28 60Z" />
    <path d="M34 46 C46 46 54 40 56 30 C46 28 38 34 34 46Z" />
    <path d="M42 32 C34 28 32 20 34 12 C42 16 46 24 42 32Z" />
    <path d="M48 22 C58 22 64 16 66 8 C58 8 50 12 48 22Z" />
  </svg>
);

// Filtros SVG: bordes rasgados del papel y tinta irregular del sello
const Filters = () => (
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
);

// Burbujas que forman el contorno de la nube de pensamiento
const CLOUD_BUBBLES = Array.from({ length: 14 }, (_, i) => {
  const a = (i / 14) * Math.PI * 2;
  return {
    cx: Number((300 + 225 * Math.cos(a)).toFixed(1)),
    cy: Number((180 + 130 * Math.sin(a)).toFixed(1)),
    r: 46 + (i % 3) * 5,
  };
});

// Página izquierda del cuaderno (solo escritorio)
const LeftPage = ({ onBack }: { onBack: TurnHandler }) => (
  <aside className="nb-cover nb-cover--paper">
    <div className="nb-lp-head">
      <Compass size={22} aria-hidden="true" />
      <span>Bitácora de Campo #048 · Huella Puriqay</span>
      <span className="nb-lp-pag">Pág. 01</span>
    </div>

    {/* Marku pensando la frase dentro de una nube */}
    <div className="nb-think">
      <div className="nb-think-cloud">
        <svg className="nb-think-svg" viewBox="-10 -10 620 490" aria-hidden="true">
          <defs>
            <g id="nbc-shape">
              {CLOUD_BUBBLES.map((b, i) => (
                <circle key={i} cx={b.cx} cy={b.cy} r={b.r} />
              ))}
              <ellipse cx="300" cy="180" rx="232" ry="128" />
              {/* globitos que bajan hacia la cabeza de Marku */}
              <circle cx="252" cy="402" r="22" />
              <circle cx="232" cy="436" r="14" />
              <circle cx="216" cy="458" r="8" />
            </g>
          </defs>
          <use href="#nbc-shape" fill="#0f4f55" stroke="#0f4f55" strokeWidth="14" strokeLinejoin="round" />
          <use href="#nbc-shape" fill="#fffaf0" />
        </svg>
        <p className="nb-think-text">
          El viaje no se mide en kilómetros recorridos, sino en las comunidades protegidas y los
          senderos florecidos que dejamos a nuestro paso.
        </p>
      </div>

      <div className="nb-think-row">
        <img className="nb-think-marku" src="/img/marku-pensando-solo.png" alt="Marku pensando" />

        <div className="nb-lp-compass">
          <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M60 8 C90 7 113 30 112 60 C111 90 89 113 59 112 C30 111 8 89 9 59 C10 31 31 9 60 8Z" />
            <circle cx="60" cy="60" r="40" strokeDasharray="2 6" />
            <path d="M60 14 L60 24 M60 96 L60 106 M14 60 L24 60 M96 60 L106 60" />
            <g transform="rotate(35 60 60)">
              <path d="M60 26 L68 60 L60 94 L52 60Z" />
              <path d="M60 26 L68 60 L52 60Z" fill="currentColor" fillOpacity=".25" />
            </g>
            <circle cx="60" cy="60" r="3.5" fill="currentColor" />
          </svg>
          <p>
            Coordenadas Verdes:
            <br />
            -13.1631° S, -72.5450° W
          </p>
        </div>
      </div>
    </div>

    <PageLeaves className="nb-lp-leaf" />

    <div className="nb-lp-foot">
      <span></span>
      <Link to="/" onClick={onBack} className="nb-lp-back">
        <ArrowLeft size={16} aria-hidden="true" /> Volver a página anterior
      </Link>
    </div>
  </aside>
);

// Pestañas-separador: "Ingresar" sí es un enlace al login, las demás son decoración
const Tabs = ({ onLogin }: { onLogin: TurnHandler }) => (
  <nav className="nb-tabs" aria-label="Secciones">
    <Link to="/" onClick={onLogin} className="nb-tab nb-tab--ingresar">
      <BookOpen size={15} aria-hidden="true" /> Ingresar
    </Link>
    <span className="nb-tab nb-tab--registro nb-tab--active" aria-current="page">
      <UserPlus size={15} aria-hidden="true" /> Registro
    </span>
    <span className="nb-tab nb-tab--clave" aria-hidden="true" style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <Flag size={15} /> Misiones
    </span>
    <span className="nb-tab nb-tab--rutas" aria-hidden="true" style={{ pointerEvents: 'none', userSelect: 'none' }}>
      <KeyRound size={15} /> Rutas
    </span>
  </nav>
);

// Marco común: escritorio, libro, página izquierda y hoja derecha
function Shell({
  children,
  onLogin,
  turning,
  turnIn,
}: {
  children: ReactNode;
  onLogin: TurnHandler;
  turning: TurnDir | null;
  turnIn: TurnDir | null;
}) {
  const rootClass = [
    'nb-scope',
    'nb-desk',
    turning && `nb-turn-out-${turning}`,
    turnIn && `nb-turn-in-${turnIn}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <Filters />
      <main className="nb-book nb-book--reg">
        <LeftPage onBack={onLogin} />

        <section className="nb-page">
          <Tabs onLogin={onLogin} />

          {/* Pestañas decorativas del borde derecho */}
          <div className="nb-side" aria-hidden="true">
            <span className="nb-side-t nb-side-t--a">Voluntariado</span>
            <span className="nb-side-t nb-side-t--b">Puriqay</span>
          </div>

          <HandSun />

          {children}

          <PageLeaves />
        </section>
      </main>
    </div>
  );
}

// Fase 1 del registro (fricción cero): solo lo mínimo para crear la cuenta.
// El resto de los datos del voluntario (DNI, contacto de emergencia, centro de
// estudios, dirección, tallas, etc.) se piden después mediante el modal de
// "Completado de Perfil Progresivo" en Dashboard.tsx la primera vez que inicia sesión.
export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Efecto de pasar la hoja (entrada desde el login / salida de vuelta al login)
  const { turning, turnTo } = usePageTurn();
  const turnIn = useTurnIn();
  const goLogin = turnTo('/', 'prev');

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

    // Los datos del perfil viajan como metadata del signUp: el trigger
    // handle_new_user los copia a la tabla profiles al crear la cuenta.
    // Así funciona igual con o sin verificación de correo activada, porque no
    // dependemos de tener sesión iniciada para guardarlos.
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          first_name: limpiarNombre(formData.firstName),
          last_name: limpiarNombre(formData.lastName),
          birth_date: formData.birthDate,
          phone: formData.phone,
        },
      },
    });

    if (authError) {
      // Con "Confirm email" activo (producción) Supabase no devuelve error si el correo ya
      // existe, para no revelar qué correos están registrados. Aquí se imita ese mismo
      // comportamiento cuando sí devuelve el error (p. ej. en entornos sin confirmación).
      if (authError.code === 'user_already_exists') {
        setEmailSent(true);
      } else {
        setErrorMsg(traducirErrorAuth(authError));
      }
      setLoading(false);
      return;
    }

    // Con "Confirm email" activado en Supabase, signUp no devuelve sesión:
    // la cuenta existe pero recién se activa al hacer clic en el correo.
    if (authData.user && !authData.session) {
      setEmailSent(true);
    } else if (authData.session) {
      toast.success('¡Registro exitoso! Bienvenido a Puriqay.');
      navigate('/dashboard', { replace: true });
    }

    setLoading(false);
  };

  const { min: minBirthDate, max: maxBirthDate } = birthDateLimits();

  // Pantalla posterior al registro cuando Supabase exige verificar el correo.
  if (emailSent) {
    return (
      <Shell onLogin={goLogin} turning={turning} turnIn={turnIn}>
        <div className="nb-head">
          <h1 className="nb-title">
            <Rays side="l" />
            ¡Revisa<br />tu correo!
            <Rays side="r" />
          </h1>
        </div>

        <div className="nb-tag nb-tag--c">
          <div className="nb-paper nb-mail">
            <div className="nb-mail-ico"><MailCheck size={32} aria-hidden="true" /></div>
            <p>
              Te enviamos un enlace de confirmación a <b>{formData.email}</b>. Haz clic en ese
              enlace para activar tu cuenta y poder ingresar.
            </p>
            <small>Si no lo ves en unos minutos, revisa tu carpeta de spam o correo no deseado.</small>
          </div>
        </div>

        <div className="nb-stamp-wrap">
          <Rays side="l" />
          <Link to="/" onClick={goLogin} className="nb-stamp">
            <img src="/img/puriqay-p-circulo.png" alt="" />
            <span className="nb-sep" aria-hidden="true" />
            Ir a iniciar sesión
          </Link>
          <Rays side="r" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell onLogin={goLogin} turning={turning} turnIn={turnIn}>
      <div className="nb-head">
        <h1 className="nb-title">
          <Rays side="l" />
          ¡Crea tu<br />pasaporte!
          <Rays side="r" />
        </h1>
        <p className="nb-sub">Crea tu cuenta en un minuto.</p>
      </div>

      <form onSubmit={handleRegister}>
        {/* Papelito 1: nombres y apellidos */}
        <div className="nb-tag">
          <div className="nb-paper">
            <div className="nb-two">
              <label className="nb-field">
                <span className="nb-lbl"><User size={18} aria-hidden="true" /> Nombres</span>
                <input
                  type="text"
                  name="firstName"
                  required
                  autoComplete="given-name"
                  pattern={PATTERNS.soloLetras}
                  title={TITLES.soloLetras}
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Ej. Mateo"
                />
              </label>
              <label className="nb-field">
                <span className="nb-lbl"><User size={18} aria-hidden="true" /> Apellidos</span>
                <input
                  type="text"
                  name="lastName"
                  required
                  autoComplete="family-name"
                  pattern={PATTERNS.soloLetras}
                  title={TITLES.soloLetras}
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Ej. Ramos"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Papelito 2: correo y contraseña */}
        <div className="nb-tag nb-tag--r">
          <div className="nb-paper">
            <label className="nb-field">
              <span className="nb-lbl"><Mail size={18} aria-hidden="true" /> Correo electrónico</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
              />
            </label>
            <label className="nb-field">
              <span className="nb-lbl">
                <Lock size={18} aria-hidden="true" /> Contraseña
                <small>(Mín. 10, con mayúscula, número y símbolo)</small>
              </span>
              <input
                type="password"
                name="password"
                required
                minLength={10}
                autoComplete="new-password"
                pattern={PATTERNS.password}
                title={TITLES.password}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••••"
              />
            </label>
          </div>
        </div>

        {/* Papelito 3: fecha de nacimiento y celular */}
        <div className="nb-tag">
          <div className="nb-paper">
            <div className="nb-two">
              <label className="nb-field">
                <span className="nb-lbl"><CalendarDays size={18} aria-hidden="true" /> Fecha de nacimiento</span>
                <input
                  type="date"
                  name="birthDate"
                  required
                  autoComplete="bday"
                  min={minBirthDate}
                  max={maxBirthDate}
                  value={formData.birthDate}
                  onChange={handleChange}
                />
              </label>
              <label className="nb-field">
                <span className="nb-lbl">
                  <Smartphone size={18} aria-hidden="true" /> Celular
                  <small>(9 dígitos)</small>
                </span>
                <input
                  type="tel"
                  name="phone"
                  required
                  maxLength={9}
                  inputMode="numeric"
                  autoComplete="tel"
                  pattern={PATTERNS.celular}
                  title={TITLES.celular}
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="987654321"
                />
              </label>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="nb-error" role="alert">
            {errorMsg}
          </div>
        )}

        <div className="nb-stamp-wrap">
          <Rays side="l" />
          <button type="submit" disabled={loading} className="nb-stamp">
            <img src="/img/puriqay-p-circulo.png" alt="" />
            <span className="nb-sep" aria-hidden="true" />
            {loading ? 'Procesando...' : 'Crear mi pasaporte'}
          </button>
          <Rays side="r" />
        </div>
      </form>

      <Link to="/" onClick={goLogin} className="nb-swap">
        <BookOpen size={28} aria-hidden="true" />
        <span className="nb-swap-t">
          <small>¿Ya tienes tu pasaporte?</small>
          <b>Inicia sesión</b>
        </span>
        <ArrowRight size={22} aria-hidden="true" />
      </Link>
    </Shell>
  );
}