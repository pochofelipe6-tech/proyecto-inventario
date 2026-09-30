import express from 'express';
import helmet from 'helmet';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { resolve } from 'node:path';
import { productSchema } from '../shared/schema.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: { directives: { 'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co'], 'img-src': ["'self'", 'data:'], 'upgrade-insecure-requests': null } } }));
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', configured: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY) }));
  app.use('/api', async (req, res, next) => {
    const token = req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
    if (!token) { res.status(401).json({ error: 'Debes iniciar sesión.' }); return; }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) { res.status(503).json({ error: 'Configura Supabase en el archivo .env del servidor.' }); return; }
    try {
      const db = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await db.auth.getUser(token);
      if (error || !data.user) { res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión nuevamente.' }); return; }
      res.locals.db = db;
      res.locals.userId = data.user.id;
      next();
    } catch (error) { next(error); }
  });
  app.get('/api/users', async (_req, res, next) => {
    try {
      const { data, error } = await (res.locals.db as SupabaseClient).from('profiles').select('id,full_name,email,created_at').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) { next(error); }
  });
  app.get('/api/products', async (_req, res, next) => {
    try {
      const { data, error } = await (res.locals.db as SupabaseClient).from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error) { next(error); }
  });
  app.post('/api/products', async (req, res, next) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: parsed.error.issues[0].message }); return; }
    try {
      const { data, error } = await (res.locals.db as SupabaseClient).from('products').insert({ ...parsed.data, created_by: res.locals.userId }).select().single();
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) { next(error); }
  });
  app.put('/api/products/:id', async (req, res, next) => {
    const parsed = productSchema.safeParse(req.body);
    if (!parsed.success || !z.string().uuid().safeParse(req.params.id).success) { res.status(400).json({ error: 'Revisa los datos del computador.' }); return; }
    try {
      const { data, error } = await (res.locals.db as SupabaseClient).from('products').update(parsed.data).eq('id', req.params.id).select().maybeSingle();
      if (error) throw error;
      if (!data) { res.status(404).json({ error: 'El computador ya no existe.' }); return; }
      res.json(data);
    } catch (error) { next(error); }
  });
  app.delete('/api/products/:id', async (req, res, next) => {
    if (!z.string().uuid().safeParse(req.params.id).success) { res.status(400).json({ error: 'Código de equipo inválido.' }); return; }
    try {
      const { data, error } = await (res.locals.db as SupabaseClient).from('products').delete().eq('id', req.params.id).select('id').maybeSingle();
      if (error) throw error;
      if (!data) { res.status(404).json({ error: 'El computador ya no existe.' }); return; }
      res.status(204).end();
    } catch (error) { next(error); }
  });
  app.use('/api', (_req, res) => { res.status(404).json({ error: 'Ruta no encontrada.' }); });
  app.use(express.static(resolve('dist')));
  app.get('*', (_req, res) => res.sendFile(resolve('dist/index.html')));
  app.use((error: { code?: string; status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error.code === '23505') { res.status(409).json({ error: 'Ya existe un equipo con ese código o número de serie.' }); return; }
    if (error.code === '23503') { res.status(400).json({ error: 'El responsable seleccionado ya no existe.' }); return; }
    if (error.status === 400) { res.status(400).json({ error: 'El cuerpo de la solicitud no es válido.' }); return; }
    console.error('Error de API:', error);
    res.status(500).json({ error: 'No pudimos completar la operación. Revisa la conexión y la configuración de las tablas en Supabase.' });
  });
  return app;
}
