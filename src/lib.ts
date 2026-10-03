import { createClient } from '@supabase/supabase-js';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url?.startsWith('https://') && key && !url.includes('TU-PROYECTO') ? createClient(url, key) : null;
export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const session = await supabase?.auth.getSession();
  const token = session?.data.session?.access_token;
  if (!token) throw new Error('Inicia sesión para continuar.');
  const response = await fetch(`/api${path}`, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...options?.headers } });
  if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || 'No pudimos conectar con el servidor.'); }
  return response.status === 204 ? undefined as T : response.json();
}
