/**
 * Capa de acceso a datos de la HU-2 (inventario).
 *
 * Segunda entrega: cada función llama al servicio REST /api/inventario. La firma y lo que
 * devuelve son los mismos de la primera entrega, así que ni el Context ni los componentes
 * cambiaron. El usuario que hace un cambio lo toma el servidor del token de sesión.
 */
import { api, restablecerDesdeServidor } from './api.js'

const ruta = (id) => encodeURIComponent(id)

// --------------------------------------------------------------------- consultas

export const listarEquipos = (filtros = {}) => api.get('/inventario/equipos', filtros)

export const obtenerResumenInventario = () => api.get('/inventario/resumen')

/** Devuelve { equipo, unidades, usuarios } (usuarios: quién hizo cada cambio de estado). */
export const obtenerEquipo = (id) => api.get(`/inventario/equipos/${ruta(id)}`)

/** Vista 2.6: la ficha pública se puede ver sin sesión. */
export const obtenerFichaPublica = (id) => api.get(`/inventario/publico/equipos/${ruta(id)}`)

/** Lectura para otras historias: cada equipo con sus unidades (sin datos internos). */
export const listarEquiposConUnidades = ({ soloPublicados = false } = {}) =>
  api.get('/inventario/con-unidades', { soloPublicados: soloPublicados || undefined })

/** Categorías del catálogo (tabla categorias de la base), con cuántos equipos tiene cada una. */
export const listarCategorias = () => api.get('/inventario/categorias')

export const listarClavesEquipos = () => api.get('/inventario/claves')

export const listarCodigosOcupados = () => api.get('/inventario/codigos')

// ------------------------------------------------------------- escritura: equipo

export const crearEquipo = (datos, { esBorrador = false } = {}) =>
  api.post('/inventario/equipos', { ...datos, esBorrador })

export const actualizarEquipo = (id, datos, { esBorrador } = {}) =>
  api.put(`/inventario/equipos/${ruta(id)}`, { ...datos, esBorrador })

/** Vista 2.5: solo la pestaña de condiciones del préstamo. */
export const guardarCondiciones = (id, condiciones) =>
  api.put(`/inventario/equipos/${ruta(id)}/condiciones`, condiciones)

export const eliminarEquipo = (id) => api.delete(`/inventario/equipos/${ruta(id)}`)

// ------------------------------------------------------------- escritura: unidad

export const crearUnidad = (equipoId, datos) =>
  api.post(`/inventario/equipos/${ruta(equipoId)}/unidades`, datos)

export const actualizarUnidad = (id, datos) => api.put(`/inventario/unidades/${ruta(id)}`, datos)

export const eliminarUnidad = (id) => api.delete(`/inventario/unidades/${ruta(id)}`)

/** Vista 2.4: cambio manual de estado (la HU-4 y la HU-5 lo hacen en el servidor). */
export const cambiarEstadoUnidad = (id, { estadoNuevo, motivo }) =>
  api.patch(`/inventario/unidades/${ruta(id)}/estado`, { estadoNuevo, motivo })

// ----------------------------------------------------------------- mantenimiento

export const restablecerSemilla = restablecerDesdeServidor
