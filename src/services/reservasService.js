/**
 * Capa de acceso a datos de la HU-6 (reservas y lista de espera).
 *
 * Segunda entrega: cada función llama al servicio REST /api/reservas con la misma firma.
 * El estudiante lo toma el servidor del token. Al convertir una reserva próxima, el
 * servidor crea la solicitud en la tabla compartida, y el encargado la ve en su bandeja.
 */
import { api } from './api.js'

export const listarEquiposReservables = () => api.get('/reservas/equipos')

/** Vista 6.3: reservas del usuario en sesión. */
export async function listarReservas(usuarioId) {
  if (!usuarioId) return []
  return api.get('/reservas/mias')
}

/** Reservas que comprometen una unidad (calendario de ocupación). */
export const listarReservasOcupacion = () => api.get('/reservas/ocupacion')

/** Vista 6.4 del estudiante: sus reservas en espera y su puesto. */
export async function listarListaEspera(usuarioId) {
  if (!usuarioId) return []
  return api.get('/reservas/espera/mias')
}

/** Vista 6.4 del encargado: la cola de cada equipo. */
export const listarEsperaPorEquipo = () => api.get('/reservas/espera')

/** Todas las reservas en espera, en una sola lista (lectura para otras historias). */
export async function listarEnEspera() {
  const grupos = await listarEsperaPorEquipo()
  return grupos.flatMap((grupo) => grupo.reservas)
}

/** Vista 6.2: confirmada si hay unidad libre; si no, entra a la lista de espera. */
export const crearReserva = ({ equipoId, fechaInicio, fechaFin, motivo }) =>
  api.post('/reservas', { equipoId, fechaInicio, fechaFin, motivo })

export const cancelarReserva = (id) => api.post(`/reservas/${encodeURIComponent(id)}/cancelacion`)

/** Reservas que empiezan en los próximos 7 días → solicitudes pendientes (HU-4). */
export const convertirReservasProximas = () => api.post('/reservas/conversiones')

/** Fecha local AAAA-MM-DD (la usa el calendario). */
export function fechaLocal(fecha = new Date()) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
}

export function seSolapan(inicioA, finA, inicioB, finB) {
  return inicioA <= finB && inicioB <= finA
}
