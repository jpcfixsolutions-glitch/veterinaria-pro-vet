export function notFound(_req, _res, next) { const error = new Error('Ruta no encontrada.'); error.status = 404; next(error) }
export function errorHandler(error, _req, res, _next) { console.error(error); res.status(error.status || 500).json({ message: error.status ? error.message : 'Error interno del servidor.' }) }
