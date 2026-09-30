import type { Product, Profile } from '../shared/schema';
export const demoUsers: Profile[] = [
  { id: '10000000-0000-4000-8000-000000000001', full_name: 'Laura Martínez', email: 'laura@example.com', created_at: '2026-09-10T14:00:00Z' },
  { id: '10000000-0000-4000-8000-000000000002', full_name: 'Andrés García', email: 'andres@example.com', created_at: '2026-09-12T14:00:00Z' },
  { id: '10000000-0000-4000-8000-000000000003', full_name: 'Valentina Torres', email: 'valentina@example.com', created_at: '2026-09-15T14:00:00Z' }
];
export const demoProducts: Product[] = [
  ['Dell', 'Latitude 5440', 'Asignado', 'Portátil', 'Administración', demoUsers[0].id],
  ['Apple', 'MacBook Pro M3', 'Asignado', 'Portátil', 'Diseño', demoUsers[2].id],
  ['Lenovo', 'ThinkPad E14', 'Disponible', 'Portátil', 'Oficina principal', null],
  ['HP', 'ProDesk 400 G9', 'Mantenimiento', 'Escritorio', 'Soporte técnico', null],
  ['Dell', 'OptiPlex 7410', 'Disponible', 'Todo en uno', 'Oficina principal', null],
  ['Lenovo', 'ThinkCentre M70', 'Asignado', 'Escritorio', 'Operaciones', demoUsers[1].id]
].map((r, i) => ({ id: `20000000-0000-4000-8000-00000000000${i + 1}`, asset_tag: `PC-${String(i + 1).padStart(3, '0')}`, brand: r[0]!, model: r[1]!, status: r[2] as Product['status'], type: r[3] as Product['type'], location: r[4]!, assigned_to: r[5], serial_number: `DEMO-SN-00${i + 1}`, ram_gb: 16, storage_gb: 512, processor: i === 1 ? 'Apple M3' : 'Intel Core i5', notes: '', created_at: '2026-09-20T14:00:00Z', updated_at: '2026-09-20T14:00:00Z' }));
