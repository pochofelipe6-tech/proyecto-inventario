import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
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
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const origin = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(`${origin}/api/health`)).status, 200);
    for (const [path, method] of [['/users', 'GET'], ['/products', 'GET'], ['/products', 'POST'], ['/products/example', 'PUT'], ['/products/example', 'DELETE']]) {
      const response = await fetch(`${origin}/api${path}`, { method });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).error, 'Debes iniciar sesión.');
    }
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())); }
});
