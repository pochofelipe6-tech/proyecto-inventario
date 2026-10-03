import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET as health } from '../app/api/health/route';
import { GET as users } from '../app/api/users/route';
import { GET as products, POST as createProduct } from '../app/api/products/route';
import { PUT as updateProduct, DELETE as deleteProduct } from '../app/api/products/[id]/route';
import { ApiError, readJson, apiError } from '../app/lib/api';
import { productSchema } from '../shared/schema.js';

const valid = { asset_tag: ' PC-001 ', brand: 'Dell', model: 'Latitude', serial_number: 'SN-001', type: 'Portátil', status: 'Disponible', location: 'Oficina', assigned_to: null, processor: 'Core i5', ram_gb: 16, storage_gb: 512, notes: '' };
test('Normaliza texto y valida un computador disponible', () => {
  assert.equal(productSchema.parse(valid).asset_tag, 'PC-001');
});
test('Rechaza asignaciones inconsistentes y capacidades inválidas', () => {
  assert.equal(productSchema.safeParse({ ...valid, status: 'Asignado' }).success, false);
  assert.equal(productSchema.safeParse({ ...valid, assigned_to: '10000000-0000-4000-8000-000000000001' }).success, false);
  assert.equal(productSchema.safeParse({ ...valid, ram_gb: -1 }).success, false);
  assert.equal(productSchema.safeParse({ ...valid, storage_gb: 1.5 }).success, false);
  assert.equal(productSchema.safeParse({ ...valid, serial_number: ' ' }).success, false);
});
test('Acepta asignación con responsable y rechaza campos no autorizados', () => {
  assert.equal(productSchema.safeParse({ ...valid, status: 'Asignado', assigned_to: '10000000-0000-4000-8000-000000000001' }).success, true);
  assert.equal(productSchema.safeParse({ ...valid, created_by: 'attacker' }).success, false);
});
test('API exige autenticación para consultar y modificar datos', async () => {
  assert.equal(health().status, 200);
  const context = { params: Promise.resolve({ id: 'example' }) };
  const responses = await Promise.all([
    users(new Request('http://localhost/api/users')),
    products(new Request('http://localhost/api/products')),
    createProduct(new Request('http://localhost/api/products', { method: 'POST' })),
    updateProduct(new Request('http://localhost/api/products/example', { method: 'PUT' }), context),
    deleteProduct(new Request('http://localhost/api/products/example', { method: 'DELETE' }), context),
  ]);
  for (const response of responses) {
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, 'Debes iniciar sesión.');
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
  }
});

test('El lector JSON conserva el límite y rechaza cuerpos inválidos', async () => {
  const request = (body: string) => new Request('http://localhost/api/products', { method: 'POST', body });
  assert.deepEqual(await readJson(request(JSON.stringify(valid))), valid);
  await assert.rejects(readJson(request('{')), (error: unknown) => error instanceof ApiError && error.status === 400);
  await assert.rejects(readJson(request('x'.repeat(32769))), (error: unknown) => error instanceof ApiError && error.status === 413);
});

test('Los errores de restricciones mantienen las respuestas de la API', async () => {
  assert.equal(apiError({ code: '23505' }).status, 409);
  assert.equal(apiError({ code: '23503' }).status, 400);
});

test('Las rutas verifican el token y conservan el usuario y RLS en las operaciones', async (t) => {
  const previousUrl = process.env.SUPABASE_URL;
  const previousKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_PUBLISHABLE_KEY = 'test-public-key';
  const id = '10000000-0000-4000-8000-000000000001';
  let authCalls = 0;
  const operations: string[] = [];
  t.mock.method(globalThis, 'fetch', async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get('authorization'), 'Bearer test-token');
    if (url.pathname === '/auth/v1/user') {
      authCalls++;
      return Response.json({ id, email: 'test@example.com' });
    }
    operations.push(`${init?.method || 'GET'} ${url.pathname}`);
    if (init?.method === 'POST') {
      assert.equal(JSON.parse(String(init.body)).created_by, id);
      return Response.json({ ...valid, id }, { status: 201 });
    }
    if (init?.method === 'PATCH' || init?.method === 'DELETE') {
      assert.equal(url.searchParams.get('id'), `eq.${id}`);
      return Response.json([{ ...valid, id }]);
    }
    return Response.json([]);
  });
  try {
    const request = (path: string, method = 'GET', body?: string) => new Request(`http://localhost/api${path}`, {
      method, headers: { Authorization: 'Bearer test-token' }, body,
    });
    const context = { params: Promise.resolve({ id }) };
    assert.equal((await users(request('/users'))).status, 200);
    assert.equal((await products(request('/products'))).status, 200);
    assert.equal((await createProduct(request('/products', 'POST', JSON.stringify(valid)))).status, 201);
    assert.equal((await updateProduct(request(`/products/${id}`, 'PUT', JSON.stringify(valid)), context)).status, 200);
    assert.equal((await deleteProduct(request(`/products/${id}`, 'DELETE'), context)).status, 204);
    assert.equal((await createProduct(request('/products', 'POST', '{'))).status, 400);
    assert.equal((await createProduct(request('/products', 'POST', JSON.stringify({ ...valid, created_by: id })))).status, 400);
    assert.equal(authCalls, 7);
    assert.deepEqual(operations, ['GET /rest/v1/profiles', 'GET /rest/v1/products', 'POST /rest/v1/products', 'PATCH /rest/v1/products', 'DELETE /rest/v1/products']);
  } finally {
    if (previousUrl === undefined) delete process.env.SUPABASE_URL; else process.env.SUPABASE_URL = previousUrl;
    if (previousKey === undefined) delete process.env.SUPABASE_PUBLISHABLE_KEY; else process.env.SUPABASE_PUBLISHABLE_KEY = previousKey;
  }
});
