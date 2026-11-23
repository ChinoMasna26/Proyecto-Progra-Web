/** Conversión entre las columnas de la base (snake_case) y los objetos de la API (camelCase). */
const aCamelTexto = (texto) => texto.replace(/_([a-z])/g, (_, letra) => letra.toUpperCase())
const aSnakeTexto = (texto) => texto.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`)

export function aCamel(fila) {
  if (!fila) return fila
  return Object.fromEntries(
    Object.entries(fila).map(([clave, valor]) => [aCamelTexto(clave), valor]),
  )
}

/**
 * Arma un UPDATE con solo los campos permitidos. `permitidos` es la lista blanca de campos
 * (en camelCase) que el servicio puede cambiar; lo demás se ignora.
 */
export function armarActualizacion(tabla, id, cambios, permitidos, columnasJson = []) {
  const campos = Object.keys(cambios).filter((c) => permitidos.includes(c))
  if (campos.length === 0) return null
  const asignaciones = campos.map((c, i) => `${aSnakeTexto(c)} = $${i + 2}`)
  const valores = campos.map((c) =>
    columnasJson.includes(c) && cambios[c] !== null ? JSON.stringify(cambios[c]) : cambios[c],
  )
  return {
    sql: `UPDATE ${tabla} SET ${asignaciones.join(', ')} WHERE id = $1 RETURNING *`,
    parametros: [id, ...valores],
  }
}

/** Siguiente id con prefijo, p. ej. EQ-011 o SOL-0402, a partir del mayor que existe. */
export function siguienteIdDe(ids, prefijo, ancho) {
  const numeros = ids.map((id) => Number(String(id).split('-').at(-1))).filter(Number.isFinite)
  const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1
  return `${prefijo}-${String(siguiente).padStart(ancho, '0')}`
}

export const ahora = () => new Date().toISOString()

export const normalizar = (texto) =>
  String(texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
