import { json } from '../../lib/api';

export const dynamic = 'force-dynamic';

export function GET() {
  return json({ status: 'ok', configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY) });
}
