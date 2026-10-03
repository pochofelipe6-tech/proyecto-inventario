import { z } from 'zod';
import { productSchema } from '../../../../shared/schema';
import { authenticated, json, readJson } from '../../../lib/api';

type Context = { params: Promise<{ id: string }> };

export function PUT(request: Request, context: Context) {
  return authenticated(request, async ({ db }) => {
    const { id } = await context.params;
    const parsed = productSchema.safeParse(await readJson(request));
    if (!parsed.success || !z.string().uuid().safeParse(id).success) return json({ error: 'Revisa los datos del computador.' }, 400);
    const { data, error } = await db.from('products').update(parsed.data).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'El computador ya no existe.' }, 404);
    return json(data);
  });
}

export function DELETE(request: Request, context: Context) {
  return authenticated(request, async ({ db }) => {
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return json({ error: 'Código de equipo inválido.' }, 400);
    const { data, error } = await db.from('products').delete().eq('id', id).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: 'El computador ya no existe.' }, 404);
    return new Response(null, { status: 204, headers: { 'Cache-Control': 'private, no-store' } });
  });
}
