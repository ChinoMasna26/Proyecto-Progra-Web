/**
 * Registra los módulos de cada historia. Cada carpeta `modulos/huN-*` exporta en su
 * `index.js` el prefijo y el router:
 *
 *   export default { prefijo: '/api/inventario', router }
 *
 * Las carpetas se descubren solas: agregar una historia no obliga a tocar este archivo
 * ni `app.js`, así cada integrante sube solo su carpeta sin pisar el trabajo de otro.
 */
import { readdir } from 'node:fs/promises'

export async function registrarModulos(app) {
  const carpeta = new URL('./', import.meta.url)
  const entradas = await readdir(carpeta, { withFileTypes: true })
  const modulos = entradas
    .filter((e) => e.isDirectory() && /^hu\d+-/.test(e.name))
    .map((e) => e.name)
    .sort()

  for (const nombre of modulos) {
    const { default: modulo } = await import(new URL(`./${nombre}/index.js`, carpeta))
    app.use(modulo.prefijo, modulo.router)
  }
  return modulos
}
