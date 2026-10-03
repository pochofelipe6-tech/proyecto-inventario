import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type Session = { db: SupabaseClient; userId: string };
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

export function apiError(error: unknown): Response {
  if (error instanceof ApiError) return json({ error: error.message }, error.status);
  const code = (error as { code?: string } | null)?.code;
  if (code === '23505') return json({ error: 'Ya existe un equipo con ese código o número de serie.' }, 409);
  if (code === '23503') return json({ error: 'El responsable seleccionado ya no existe.' }, 400);
  console.error('Error de API:', error);
  return json({ error: 'No pudimos completar la operación. Revisa la conexión y la configuración de las tablas en Supabase.' }, 500);
}

export async function authenticated(request: Request, handler: (session: Session) => Promise<Response>) {
  const token = request.headers.get('authorization')?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return json({ error: 'Debes iniciar sesión.' }, 401);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return json({ error: 'Configura Supabase en el archivo .env del servidor.' }, 503);
  try {
    const db = createClient(url, key, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' }, 401);
    return await handler({ db, userId: data.user.id });
  } catch (error) { return apiError(error); }
}

// Conserva el límite de 32 KiB de la API anterior, incluso sin Content-Length.
export async function readJson(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'El cuerpo de la solicitud no es válido.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 32 * 1024) {
        await reader.cancel();
        throw new ApiError(413, 'El cuerpo de la solicitud es demasiado grande.');
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ApiError(400, 'El cuerpo de la solicitud no es válido.'); }
}
