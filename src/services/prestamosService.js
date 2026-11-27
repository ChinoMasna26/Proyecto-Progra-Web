/**
 * Capa de acceso a datos de la HU-4 (aprobación y entrega).
 *
 * Segunda entrega: cada función llama al servicio REST /api/prestamos con la misma firma.
 * El encargado que aprueba o entrega lo toma el servidor del token, y la entrega marca la
 * unidad como prestada (HU-2) dentro de la misma transacción.
 */
import { api } from './api.js'

const ruta = (id) => encodeURIComponent(id)

/** Vista 4.1: bandeja con filtros por estado, equipo, fechas y texto. */
export const listarBandeja = (filtros = {}) => api.get('/prestamos/bandeja', filtros)

/** Contadores del menú lateral y de la barra superior del panel. */
export const obtenerContadores = () => api.get('/prestamos/contadores')

/** Vista 4.2: unidades libres, deuda del solicitante y próximo rango libre. */
export const obtenerOpcionesAprobacion = (id) =>
  api.get(`/prestamos/solicitudes/${ruta(id)}/aprobacion`)

export const aprobarSolicitud = (id, datos) =>
  api.post(`/prestamos/solicitudes/${ruta(id)}/aprobacion`, datos)

/** Vista 4.3: el motivo lo ve el estudiante en «Mis solicitudes». */
export const rechazarSolicitud = (id, datos) =>
  api.post(`/prestamos/solicitudes/${ruta(id)}/rechazo`, datos)

/** Vista 4.4: datos para registrar la entrega de una solicitud aprobada. */
export const obtenerParaEntrega = (id) => api.get(`/prestamos/solicitudes/${ruta(id)}/entrega`)

export const registrarEntrega = (id, datos) =>
  api.post(`/prestamos/solicitudes/${ruta(id)}/entrega`, datos)

/** Vista 4.5: el estudiante solo ve las suyas; el encargado, todas. */
export const obtenerConstancia = (codigo) => api.get(`/prestamos/constancias/${ruta(codigo)}`)

/** Vista 4.6: préstamos entregados que todavía no se devuelven. */
export const listarVigentes = () => api.get('/prestamos/vigentes')
