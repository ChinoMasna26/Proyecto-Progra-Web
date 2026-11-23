/**
 * Aplicación Express. Arma la cadena de middlewares y registra los módulos de cada
 * historia. No abre el puerto: eso lo hace `servidor.js` (así las pruebas usan la app
 * sin levantar el servidor).
 */
import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { manejarErrores, rutaNoEncontrada } from './comun/errores.js'
import { leerSesion } from './comun/sesion.js'
import { registrarModulos } from './modulos/index.js'

export async function crearApp() {
  const app = express()

  app.use(cors({ origin: config.origenes }))
  // Las fotos viajan como data URL (sin carga de archivos, enunciado §4): por eso 8 MB.
  app.use(express.json({ limit: '8mb' }))
  app.use(leerSesion)

  app.get('/api/salud', (_req, res) => res.json({ estado: 'ok' }))
  const modulos = await registrarModulos(app)
  app.locals.modulos = modulos

  app.use('/api', rutaNoEncontrada)
  app.use(manejarErrores)
  return app
}
