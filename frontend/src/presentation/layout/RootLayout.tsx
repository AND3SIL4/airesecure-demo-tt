import { Outlet } from 'react-router-dom';
import { Toaster } from '../components/Toaster';

/** Raíz del router: envuelve todas las rutas y monta el Toaster dentro del contexto de navegación. */
export function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
    </>
  );
}
