import { authenticated, json } from '../../lib/api';

function notFound(request: Request) {
  return authenticated(request, async () => json({ error: 'Ruta no encontrada.' }, 404));
}

export { notFound as GET, notFound as POST, notFound as PUT, notFound as PATCH, notFound as DELETE };
