/**
 * Conexión a PostgreSQL. Es el único archivo que crea el pool; los repositorios usan
 * `consultar` y, cuando una operación toca varias tablas, `enTransaccion`.
 */
import pg from 'pg'
import { config } from '../config.js'

// Los tipos se devuelven en la forma que ya usa el dominio del frontend:
// fechas como 'AAAA-MM-DD', marcas de tiempo como ISO 8601 y montos como número.
pg.types.setTypeParser(1082, (v) => v) // date
pg.types.setTypeParser(1184, (v) => new Date(v).toISOString()) // timestamptz
pg.types.setTypeParser(1700, (v) => Number(v)) // numeric
pg.types.setTypeParser(20, (v) => Number(v)) // bigint (count)

export const pool = new pg.Pool({
  connectionString: config.baseDatos,
  ssl: config.ssl ? { rejectUnauthorized: false } : false,
  max: 5,
})

// Neon cierra las conexiones inactivas cuando «duerme» la base. Sin este aviso, ese cierre
// tumbaría el servidor; así solo se registra y el pool abre otra conexión cuando haga falta.
pool.on('error', (error) => {
  console.error('Se cerró una conexión con la base de datos:', error.message)
})

/** Ejecuta una consulta con parámetros ($1, $2…). Nunca se arma SQL concatenando datos. */
export async function consultar(sql, parametros = [], cliente = pool) {
  const { rows } = await cliente.query(sql, parametros)
  return rows
}

/**
 * Corre `trabajo(cliente)` dentro de una transacción: si algo falla, no se guarda nada.
 * Se usa, por ejemplo, al entregar un préstamo (la unidad y la solicitud cambian juntas).
 */
export async function enTransaccion(trabajo) {
  const cliente = await pool.connect()
  try {
    await cliente.query('BEGIN')
    const resultado = await trabajo(cliente)
    await cliente.query('COMMIT')
    return resultado
  } catch (error) {
    await cliente.query('ROLLBACK')
    throw error
  } finally {
    cliente.release()
  }
}
