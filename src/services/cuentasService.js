/**
 * Capa de acceso a datos de la HU-1 (cuenta y acceso).
 *
 * Segunda entrega: cada función llama al servicio REST /api/cuentas con la misma firma y
 * el mismo resultado que en la primera entrega. La contraseña ahora se cifra con bcrypt en
 * el servidor, y la sesión es un token que se guarda junto con los datos del usuario.
 */
import {
  actualizarUsuarioGuardado,
  api,
  borrarSesion,
  guardarSesion,
  leerSesionGuardada,
} from './api.js'

// ----------------------------------------------------------------------- sesión

/** Vista 1.2. El servidor controla los intentos fallidos y el bloqueo temporal. */
export async function iniciarSesion({ correo, contrasena, recordarme = false }) {
  const { token, usuario, aviso } = await api.post('/cuentas/sesion', { correo, contrasena })
  guardarSesion({ token, usuario }, recordarme)
  return { usuario, aviso }
}

/** Usuario guardado al iniciar sesión (se lee sin esperar, para que recargar no saque). */
export function obtenerSesion() {
  return leerSesionGuardada()?.usuario ?? null
}

/** Relee el usuario del servidor: un bloqueo o una deuda nueva se notan al instante. */
export async function refrescarSesion() {
  if (!leerSesionGuardada()) return null
  try {
    const usuario = await api.get('/cuentas/yo')
    actualizarUsuarioGuardado(usuario)
    return usuario
  } catch (e) {
    if (e.estado === 401) {
      borrarSesion()
      return null
    }
    return obtenerSesion() // sin conexión se sigue con lo guardado
  }
}

export function cerrarSesion() {
  borrarSesion()
}

// ---------------------------------------------------------------------- registro

/** Vista 1.3: la cuenta queda «por verificar» hasta abrir el enlace del correo. */
export const registrarEstudiante = (datos) => api.post('/cuentas/estudiantes', datos)

/** Vista 1.4: el alta queda pendiente hasta que la apruebe el jefe de laboratorio. */
export const registrarEncargado = (datos) => api.post('/cuentas/encargados', datos)

export const verificarCuenta = (token) => api.post('/cuentas/verificacion', { token })

// ------------------------------------------------------------------ recuperación

export const solicitarRecuperacion = (correo) => api.post('/cuentas/recuperacion', { correo })

export const revisarEnlaceRecuperacion = (token) =>
  api.get(`/cuentas/recuperacion/${encodeURIComponent(token ?? '')}`)

export const restablecerContrasena = (token, datos) =>
  api.post(`/cuentas/recuperacion/${encodeURIComponent(token ?? '')}`, datos)

// --------------------------------------------------------------------- mi cuenta

/** Vista 1.6. El servidor usa el usuario del token, no el id que diga el cliente. */
export async function actualizarPerfil(_usuarioId, datos) {
  const usuario = await api.patch('/cuentas/yo', datos)
  actualizarUsuarioGuardado(usuario)
  return usuario
}

export async function cambiarContrasena(_usuarioId, datos) {
  await api.put('/cuentas/yo/contrasena', datos)
  return true
}

export const obtenerResumenPrestamos = () => api.get('/cuentas/yo/resumen-prestamos')

// ------------------------------------------------------- lectura para otras historias

/**
 * Datos públicos de los usuarios. La lista completa solo la puede pedir el encargado;
 * a cualquier otro usuario se le devuelve solo su propio registro.
 */
export async function listarUsuariosPublicos() {
  const yo = obtenerSesion()
  if (yo?.rol !== 'encargado') return yo ? [yo] : []
  return api.get('/cuentas/usuarios')
}

/**
 * La deuda la calcula y la guarda el servidor al registrar una devolución o un pago (HU-5).
 * Se mantiene por compatibilidad con la primera entrega: desde el navegador no hace nada.
 */
export async function establecerDeuda() {
  return null
}
