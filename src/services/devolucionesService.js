/**
 * Capa de acceso a datos de la HU-5 (devoluciones).
 *
 * Segunda entrega: cada función llama al servicio REST /api/devoluciones con la misma
 * firma. El servidor calcula el retraso y la penalidad, cambia la unidad (HU-2) y guarda la
 * deuda (HU-1) en una sola transacción.
 */
import { api } from './api.js'

const ruta = (id) =>
  encodeURIComponent(
    String(id ?? '')
      .trim()
      .toUpperCase(),
  )

/** Vista 5.1: préstamos por devolver, los vencidos primero. */
export const listarPorDevolver = () => api.get('/devoluciones/por-devolver')

/** Vista 5.1: el préstamo buscado por su código. */
export const obtenerParaDevolucion = (codigo) => api.get(`/devoluciones/prestamos/${ruta(codigo)}`)

/** Vistas 5.1 y 5.2: registra la devolución, los daños y la penalidad. */
export const registrarDevolucion = (codigo, datos) =>
  api.post(`/devoluciones/prestamos/${ruta(codigo)}/devolucion`, datos)

/** Vista 5.3: si el préstamo se puede renovar y hasta cuándo. */
export const consultarRenovacion = (codigo) =>
  api.get(`/devoluciones/prestamos/${ruta(codigo)}/renovacion`)

export const renovarPrestamo = (codigo, { dias }) =>
  api.post(`/devoluciones/prestamos/${ruta(codigo)}/renovacion`, { dias })

/** Vista 5.4 (y «Mi deuda» del estudiante). */
export const obtenerHistorial = (estudianteId) =>
  api.get(`/devoluciones/estudiantes/${encodeURIComponent(estudianteId)}/historial`)

/** «Registrar pago» (5.4): las penalidades pendientes quedan pagadas. */
export const registrarPago = (estudianteId) =>
  api.post(`/devoluciones/estudiantes/${encodeURIComponent(estudianteId)}/pago`)
