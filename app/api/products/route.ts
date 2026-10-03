import { productSchema } from '../../../shared/schema';
import { authenticated, json, readJson } from '../../lib/api';

export function GET(request: Request) {
  return authenticated(request, async ({ db }) => {
    const { data, error } = await db.from('products').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return json(data);
  });
}

export function POST(request: Request) {
  return authenticated(request, async ({ db, userId }) => {
    const parsed = productSchema.safeParse(await readJson(request));
    if (!parsed.success) return json({ error: parsed.error.issues[0].message }, 400);
    const { data, error } = await db.from('products').insert({ ...parsed.data, created_by: userId }).select().single();
    if (error) throw error;
    return json(data, 201);
  });
}
