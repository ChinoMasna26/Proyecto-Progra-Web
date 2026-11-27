/**
 * Capa de acceso a datos de la HU-3 (catálogo y solicitud).
 *
 * Segunda entrega: cada función llama al servicio REST /api/catalogo con la misma firma y
 * el mismo resultado. Las reglas (fechas libres, solicitudes repetidas, deuda) las vuelve
 * a aplicar el servidor, que no confía en el cliente.
 */
import { api, restablecerDesdeServidor } from './api.js'

const ruta = (id) => encodeURIComponent(id)

/** Vista 3.1. Las categorías viajan en la URL separadas por coma. */
export const listarCatalogo = (filtros = {}) => api.get('/catalogo/equipos', filtros)

/** Vista 3.2: ficha del equipo con su disponibilidad. */
export const obtenerDetalleEquipo = (id) => api.get(`/catalogo/equipos/${ruta(id)}`)

/** Vista 3.3: unidades libres para el rango que está eligiendo el estudiante. */
export const consultarDisponibilidad = (equipoId, inicio, fin) =>
  api.get(`/catalogo/equipos/${ruta(equipoId)}/disponibilidad`, { inicio, fin })

/** Vista 3.4: solicitudes del estudiante en sesión (el servidor lo toma del token). */
export async function listarMisSolicitudes(estudianteId) {
  if (!estudianteId) return []
  return api.get('/catalogo/solicitudes/mias')
}

export const crearSolicitud = (datos) => api.post('/catalogo/solicitudes', datos)

export const retirarSolicitud = (id) => api.post(`/catalogo/solicitudes/${ruta(id)}/retiro`)

export const restablecerSolicitudes = restablecerDesdeServidor
