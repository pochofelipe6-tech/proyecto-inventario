import { authenticated, json } from '../../lib/api';

export function GET(request: Request) {
  return authenticated(request, async ({ db }) => {
    const { data, error } = await db.from('profiles').select('id,full_name,email,created_at').order('created_at', { ascending: false });
    if (error) throw error;
    return json(data);
  });
}
