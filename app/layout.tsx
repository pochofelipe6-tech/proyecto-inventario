import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import '../src/styles.css';

export const metadata: Metadata = {
  title: 'Nexo · Inventario de equipos',
  description: 'Nexo: inventario de computadores y equipo de trabajo.',
};
export const viewport: Viewport = { themeColor: '#183f36' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="es"><body>{children}</body></html>;
}
