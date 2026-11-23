import { flushSync } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import type { MouseEvent as ReactMouseEvent } from 'react';

// 'next' = pasar la hoja hacia adelante (login -> registro)
// 'prev' = volver la hoja hacia atrás (registro -> login)
export type TurnDir = 'next' | 'prev';
export type TurnHandler = (e: ReactMouseEvent<HTMLElement>) => void;

type DocConTransicion = Document & {
  startViewTransition?: (callback: () => void | Promise<void>) => { finished: Promise<unknown> };
};

// Uso: <Link to="/register" onClick={turnTo('/register', 'next')}>
// La animación la hace el navegador (View Transitions) con el CSS de notebook.css.
// Si el navegador no la soporta, en móvil o con "reducir movimiento", cambia de pantalla sin animar.
export function usePageTurn() {
  const navigate = useNavigate();

  const turnTo = (to: string, dir: TurnDir): TurnHandler => (e) => {
    // Deja funcionar clic con Ctrl/Cmd, nueva pestaña, etc.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();

    const doc = document as DocConTransicion;
    const puedeAnimar =
      typeof doc.startViewTransition === 'function' &&
      window.matchMedia('(min-width: 821px)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!puedeAnimar) {
      navigate(to);
      return;
    }

    // El CSS usa esta marca para saber hacia qué lado gira la hoja
    const root = document.documentElement;
    root.dataset.nbTurn = dir;

    try {
      const transicion = doc.startViewTransition!(() => {
        // flushSync: la pantalla nueva debe estar lista cuando el navegador saque su "foto"
        flushSync(() => navigate(to));
      });
      transicion.finished.catch(() => undefined).finally(() => {
        delete root.dataset.nbTurn;
      });
    } catch {
      delete root.dataset.nbTurn;
      navigate(to);
    }
  };

  // Se mantienen estos valores para no tener que tocar Login.tsx ni Register.tsx
  return { turning: null as TurnDir | null, turnTo };
}

export function useTurnIn(): TurnDir | null {
  return null;
}