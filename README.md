# Nexo · Inventario de computadores

Aplicación en español con Next.js 16 (App Router), React, TypeScript y Supabase (PostgreSQL + Auth). Incluye registro, inicio y cierre de sesión, tabla de usuarios, creación/edición/eliminación de computadores, asignación de responsables, búsqueda, filtros, paginación y exportación CSV.

## Inicio rápido

Requiere Node.js 20.16 o superior y npm. En esta carpeta:

```powershell
npm install
npm run dev
```

Abre http://127.0.0.1:3000. Puedes seleccionar **Explorar demostración** sin configurar Supabase. Los datos de demostración son ficticios y sus cambios se pierden al salir o recargar. La demostración no crea cuentas ni escribe en la base de datos.

## Conectar Supabase

1. Crea un proyecto en https://supabase.com/dashboard.
2. En **SQL Editor**, ejecuta una vez todo el archivo [supabase/schema.sql](supabase/schema.sql) sobre un proyecto nuevo. Crea las tablas, restricciones, permisos y un trigger que agrega cada registro a la tabla de perfiles. También incorpora usuarios que ya existan.
3. Copia `.env.example` a `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

4. En la configuración del proyecto de Supabase, copia la URL del proyecto y su **publishable key** (también funciona la clave pública `anon`):

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-clave-publica
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_PUBLISHABLE_KEY=tu-clave-publica
   ```

   Las variables `NEXT_PUBLIC_` se incluyen en el navegador. Usa exclusivamente la clave pública; no uses `service_role` ni claves secretas. Las variables sin `NEXT_PUBLIC_` son para el servidor. Nunca publiques `.env`.

5. En **Authentication → URL Configuration**, configura `http://127.0.0.1:3000` como Site URL y añade `http://127.0.0.1:3000/**` y `http://localhost:3000/**` a Redirect URLs. Para producción, usa el dominio real en ambos campos.
6. Habilita el proveedor de correo y contraseña. Si está activa la confirmación por correo, el usuario debe abrir el enlace recibido antes de ingresar. Configura SMTP propio antes de usar el registro por correo con tu empresa.
7. Reinicia `npm run dev`. Regístrate, confirma el correo cuando corresponda e inicia sesión. La primera pantalla muestra **Usuarios registrados**; el menú **Inventario** abre la tabla de computadores.

## Datos del computador

Código de inventario y serie únicos (sin distinguir mayúsculas), marca, modelo, tipo, procesador, RAM, almacenamiento, ubicación, notas y estado: Disponible, Asignado, Mantenimiento o De baja. El estado Asignado exige un responsable registrado. Los demás estados no tienen responsable.

## Acceso y modelo de datos

Esta versión corresponde a **una sola empresa y un inventario compartido**. Cada persona que se registre y complete la autenticación puede consultar nombres/correos de los usuarios y crear, editar o eliminar cualquier computador. No hay roles administrativos ni separación por empresas. Configura el registro en Supabase según quién deba poder acceder; para un acceso cerrado puedes deshabilitar nuevas altas una vez creadas las cuentas necesarias.

- `auth.users`: credenciales y sesiones administradas por Supabase; la app nunca almacena contraseñas.
- `public.profiles`: nombre, correo y fecha de registro. Solo lectura para usuarios autenticados, sin acceso anónimo.
- `public.products`: inventario con políticas RLS para usuarios autenticados, sin acceso anónimo.
- El servidor verifica cada token con `auth.getUser` y consulta Supabase con el token de ese mismo usuario para conservar las políticas RLS.
- No se utiliza una clave con privilegios administrativos. La validación existe en el cliente, la API y las restricciones SQL.
- Antes de borrar una cuenta con equipos asignados, cambia la asignación de esos equipos.

Referencias: [perfiles y triggers](https://supabase.com/docs/guides/auth/managing-user-data), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) y [verificación de usuario](https://supabase.com/docs/reference/javascript/auth-getuser).

## Comandos

```powershell
npm run dev    # Next.js: interfaz y API en http://127.0.0.1:3000
npm test       # Validación de datos y protección de rutas
npm run build  # Verifica TypeScript y compila Next.js
npm run typecheck # Verifica los tipos sin compilar la aplicación
npm start      # Sirve la aplicación compilada en http://127.0.0.1:3000
```

La interfaz y la API se sirven desde Next.js en el puerto 3000. Para otro puerto usa `npm run dev -- --port 3002` o `npm start -- --port 3002`. `npm start` requiere primero `npm run build`. En producción, ejecuta Node detrás de un proxy HTTPS que reenvíe al puerto local. La configuración pública se incorpora al compilar: vuelve a ejecutar el build cuando cambies variables `NEXT_PUBLIC_`.

## Estructura

```text
src/                 Interfaz, autenticación y modo demostración
app/                 Página, layout y API de Next.js
app/lib/api.ts       Autenticación y respuestas de la API
shared/schema.ts     Tipos y validación Zod compartida
supabase/schema.sql  Base de datos y políticas de acceso
tests/               Pruebas de validación y rutas protegidas
```

## Verificación con tu base de datos

Después de conectar Supabase, comprueba el ciclo completo: registra dos cuentas, confirma sus correos, verifica que aparezcan en Usuarios, crea un computador, asígnalo a una cuenta, cambia sus características y elimínalo tras confirmar. Prueba también un código duplicado y cerrar/iniciar sesión. Las pruebas locales no reemplazan esta verificación contra tu proyecto real.

## Migración desde Vite

Se tomó como referencia la estructura de [Transporte Barranquilla](https://github.com/transportegerenciabarranquilla/transporte-barranquilla): Next.js 16, App Router y rutas en `app/api/`. La interfaz de Nexo y su autenticación con Supabase se conservan.

- No hay cambios en tablas, datos, triggers ni políticas RLS. **Si ya tienes la base configurada, no vuelvas a ejecutar `supabase/schema.sql`.**
- Renombra `VITE_SUPABASE_URL` a `NEXT_PUBLIC_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` a `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en tu `.env` o `.env.local` y en el alojamiento. Los valores siguen siendo los mismos.
- Conserva `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` para la API.
- Actualiza Site URL y Redirect URLs en Supabase Auth del puerto 5173 al 3000 si trabajas localmente. Esto es configuración de autenticación, no una migración de la base de datos.
- Se eliminan Vite y el servidor Express independiente; `npm run dev` y `npm start` ejecutan Next.js. Elimina la antigua variable `PORT=3001` si quieres usar el puerto 3000.
