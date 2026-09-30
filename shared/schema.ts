import { z } from 'zod';
export const productSchema = z.object({
  asset_tag: z.string().trim().min(1, 'Ingresa el código del equipo.').max(40),
  brand: z.string().trim().min(1, 'Ingresa la marca.').max(80),
  model: z.string().trim().min(1, 'Ingresa el modelo.').max(120),
  serial_number: z.string().trim().min(1, 'Ingresa el número de serie.').max(100),
  type: z.enum(['Portátil', 'Escritorio', 'Todo en uno']),
  status: z.enum(['Disponible', 'Asignado', 'Mantenimiento', 'De baja']),
  location: z.string().trim().min(1, 'Ingresa la ubicación.').max(120),
  assigned_to: z.string().uuid().nullable(),
  processor: z.string().trim().max(120),
  ram_gb: z.number().int().min(1).max(2048),
  storage_gb: z.number().int().min(1).max(100000),
  notes: z.string().trim().max(2000)
}).strict().refine(p => p.status !== 'Asignado' || p.assigned_to !== null, { message: 'Selecciona un responsable para un equipo asignado.', path: ['assigned_to'] }).refine(p => p.status === 'Asignado' || p.assigned_to === null, { message: 'Solo los equipos asignados pueden tener responsable.', path: ['assigned_to'] });
export type ProductInput = z.infer<typeof productSchema>;
export type Product = ProductInput & { id: string; created_at: string; updated_at: string };
export type Profile = { id: string; full_name: string; email: string; created_at: string };
