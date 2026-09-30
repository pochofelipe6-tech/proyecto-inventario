# Nexo · Inventario de computadores

Aplicación en español con React, TypeScript, Vite, Node.js, Express y Supabase (PostgreSQL + Auth). Incluye registro, inicio y cierre de sesión, tabla de usuarios, creación/edición/eliminación de computadores, asignación de responsables, búsqueda, filtros, paginación y exportación CSV.

## Inicio rápido

Requiere Node.js 20.16 o superior y npm. En esta carpeta:

```powershell
npm install
npm run dev
```

Abre http://127.0.0.1:5173. Puedes seleccionar **Explorar demostración** sin configurar Supabase. Los datos de demostración son ficticios y sus cambios se pierden al salir o recargar. La demostración no crea cuentas ni escribe en la base de datos.

## Conectar Supabase

1. Crea un proyecto en https://supabase.com/dashboard.
2. En **SQL Editor**, ejecuta una vez todo el archivo [supabase/schema.sql](supabase/schema.sql) sobre un proyecto nuevo. Crea las tablas, restricciones, permisos y un trigger que agrega cada registro a la tabla de perfiles. También incorpora usuarios que ya existan.
3. Copia `.env.example` a `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

4. En la configuración del proyecto de Supabase, copia la URL del proyecto y su **publishable key** (también funciona la clave pública `anon`):

   ```dotenv
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=tu-clave-publica
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_PUBLISHABLE_KEY=tu-clave-publica
   PORT=3001
   ```

   Las variables `VITE_` se incluyen en el navegador. Usa exclusivamente la clave pública; no uses `service_role` ni claves secretas. Las variables sin `VITE_` son para el servidor. Nunca publiques `.env`.

5. En **Authentication → URL Configuration**, configura `http://127.0.0.1:5173` como Site URL y añade `http://127.0.0.1:5173/**` y `http://localhost:5173/**` a Redirect URLs. Para producción, usa el dominio real en ambos campos.
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
npm run dev    # Vite en 5173 y API en 3001
npm test       # Validación de datos y protección de rutas
npm run build  # Verifica TypeScript y compila cliente/servidor
npm start      # Sirve la aplicación compilada en http://localhost:3001
```

La API usa el puerto 3001 por defecto. Si cambias PORT, actualiza también el proxy en `vite.config.ts` para desarrollo. `npm start` requiere primero `npm run build`. En producción, ejecuta Node detrás de un proxy HTTPS que reenvíe al puerto local. La configuración del cliente se incorpora al compilar: vuelve a ejecutar el build cuando cambies variables `VITE_`.

## Estructura

```text
src/                 Interfaz, autenticación y modo demostración
server/              API Node.js + Express
shared/schema.ts     Tipos y validación Zod compartida
supabase/schema.sql  Base de datos y políticas de acceso
tests/               Pruebas de validación y rutas protegidas
```

## Verificación con tu base de datos

Después de conectar Supabase, comprueba el ciclo completo: registra dos cuentas, confirma sus correos, verifica que aparezcan en Usuarios, crea un computador, asígnalo a una cuenta, cambia sus características y elimínalo tras confirmar. Prueba también un código duplicado y cerrar/iniciar sesión. Las pruebas locales no reemplazan esta verificación contra tu proyecto real.
