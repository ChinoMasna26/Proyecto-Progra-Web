/**
 * Cliente de la API REST (segunda entrega). Todos los servicios del frontend llaman al
 * servidor con `pedir`, que agrega el token de sesión, convierte la respuesta en JSON y,
 * si el servidor responde con error, lanza un Error con la misma forma que usaban los
 * servicios de la primera entrega (`estado`, `errores`, `tipo`…). Por eso los Context y
 * las vistas no cambiaron.
 */
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')
const CLAVE_SESION = 'almacen.sesion'

export class ErrorApi extends Error {
  constructor(mensaje, estado, extra = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    Object.assign(this, extra)
  }
}

// --------------------------------------------------------------------- sesión

/** La sesión guardada: { token, usuario }. Con «recordarme» va a localStorage. */
export function leerSesionGuardada() {
  try {
    const crudo = sessionStorage.getItem(CLAVE_SESION) ?? localStorage.getItem(CLAVE_SESION)
    return crudo ? JSON.parse(crudo) : null
  } catch {
    return null
  }
}

export function guardarSesion(sesion, recordarme = false) {
  borrarSesion()
  try {
    ;(recordarme ? localStorage : sessionStorage).setItem(CLAVE_SESION, JSON.stringify(sesion))
  } catch {
    // sin almacenamiento la sesión dura lo que dure la pestaña
  }
}

export function actualizarUsuarioGuardado(usuario) {
  const sesion = leerSesionGuardada()
  if (!sesion) return
  const recordada = (() => {
    try {
      return Boolean(localStorage.getItem(CLAVE_SESION))
    } catch {
      return false
    }
  })()
  guardarSesion({ ...sesion, usuario }, recordada)
}

export function borrarSesion() {
  try {
    sessionStorage.removeItem(CLAVE_SESION)
    localStorage.removeItem(CLAVE_SESION)
  } catch {
    // nada que limpiar
  }
}

// -------------------------------------------------------------------- pedidos

/** Arma «?a=1&b=2» sin los valores vacíos. Los arreglos van separados por coma. */
export function aConsulta(parametros = {}) {
  const pares = Object.entries(parametros)
    .filter(
      ([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && !v.length),
    )
    .map(([k, v]) => [k, Array.isArray(v) ? v.join(',') : String(v)])
  return pares.length ? `?${new URLSearchParams(pares)}` : ''
}

export async function pedir(metodo, ruta, cuerpo) {
  const cabeceras = { Accept: 'application/json' }
  const token = leerSesionGuardada()?.token
  if (token) cabeceras.Authorization = `Bearer ${token}`
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json'

  let respuesta
  try {
    respuesta = await fetch(`${BASE}/api${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    })
  } catch {
    throw new ErrorApi(
      'No pudimos conectar con el servidor. Revisa tu conexión o que la API esté encendida.',
      0,
    )
  }

  const texto = await respuesta.text()
  let datos = null
  try {
    datos = texto ? JSON.parse(texto) : null
  } catch {
    datos = null
  }

  if (!respuesta.ok) {
    // Un token vencido no sirve para nada más: se cierra la sesión guardada.
    if (respuesta.status === 401 && datos?.tipo === 'sin-sesion' && token) borrarSesion()
    const { mensaje, ...extra } = datos ?? {}
    throw new ErrorApi(
      mensaje ?? `El servidor respondió ${respuesta.status}.`,
      respuesta.status,
      extra,
    )
  }
  return datos
}

export const api = {
  get: (ruta, parametros) => pedir('GET', `${ruta}${aConsulta(parametros)}`),
  post: (ruta, cuerpo = {}) => pedir('POST', ruta, cuerpo),
  put: (ruta, cuerpo = {}) => pedir('PUT', ruta, cuerpo),
  patch: (ruta, cuerpo = {}) => pedir('PATCH', ruta, cuerpo),
  delete: (ruta) => pedir('DELETE', ruta),
}

/** Con la base de datos, la demo se restablece desde el servidor (npm run db:preparar). */
export async function restablecerDesdeServidor() {
  throw new ErrorApi(
    'Con la base de datos, los datos de prueba se restablecen en el servidor con «npm run db:preparar».',
    501,
  )
}
