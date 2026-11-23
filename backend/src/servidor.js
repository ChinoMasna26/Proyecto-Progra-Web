import { config } from './config.js'
import { crearApp } from './app.js'

const app = await crearApp()
app.listen(config.puerto, () => {
  console.log(`API del Almacén de Equipos en http://localhost:${config.puerto}/api`)
  console.log(`Módulos cargados: ${app.locals.modulos.join(', ') || 'ninguno'}`)
})
