/**
 * Repositorio compartido de solicitudes de préstamo.
 *
 * La solicitud tiene una sola tabla, pero la escriben tres historias, cada una en su
 * momento (CONTRATO-DATOS.md): la HU-3 la crea y la retira, la HU-4 la aprueba, la
 * rechaza y la entrega, y la HU-5 registra la devolución y la penalidad. Igual que el
 * `solicitudesAlmacen.js` de la primera entrega, este archivo solo lee y guarda: las
 * reglas viven en el servicio de cada historia.
 */
import { consultar, pool } from '../db/conexion.js'
import { aCamel, armarActualizacion, siguienteIdDe } from './filas.js'

const SELECT_SOLICITUD = `
  SELECT s.*,
         COALESCE(
           (SELECT json_agg(json_build_object(
                     'fechaFinAnterior', r.fecha_fin_anterior, 'fechaFinNueva', r.fecha_fin_nueva,
                     'dias', r.dias, 'fecha', r.fecha, 'por', r.por) ORDER BY r.id)
              FROM renovaciones r WHERE r.solicitud_id = s.id),
           '[]') AS renovaciones
    FROM solicitudes s`

/** Convierte la fila en el objeto que ya usaban los servicios (penalidad anidada). */
function aSolicitud(fila) {
  const {
    penalidadMonto,
    penalidadEstado,
    penalidadCalculadaEn,
    penalidadPagadaEn,
    penalidadRecibidoPor,
    ...resto
  } = aCamel(fila)
  return {
    ...resto,
    penalidad:
      penalidadMonto === null || penalidadMonto === undefined
        ? null
        : {
            monto: penalidadMonto,
            estado: penalidadEstado,
            calculadaEn: penalidadCalculadaEn,
            pagadaEn: penalidadPagadaEn,
            recibidoPor: penalidadRecibidoPor,
          },
  }
}

export async function listar(db = pool) {
  const filas = await consultar(`${SELECT_SOLICITUD} ORDER BY s.creada_en`, [], db)
  return filas.map(aSolicitud)
}

export async function listarDeEstudiante(estudianteId, db = pool) {
  const filas = await consultar(
    `${SELECT_SOLICITUD} WHERE s.estudiante_id = $1 ORDER BY s.creada_en`,
    [estudianteId],
    db,
  )
  return filas.map(aSolicitud)
}

export async function buscarPorId(id, db = pool) {
  const [fila] = await consultar(`${SELECT_SOLICITUD} WHERE s.id = $1`, [id], db)
  return fila ? aSolicitud(fila) : null
}

export async function buscarPorCodigo(codigo, db = pool) {
  const [fila] = await consultar(`${SELECT_SOLICITUD} WHERE s.codigo_prestamo = $1`, [codigo], db)
  return fila ? aSolicitud(fila) : null
}

export async function siguienteId(db = pool) {
  const filas = await consultar('SELECT id FROM solicitudes', [], db)
  return siguienteIdDe(
    filas.map((f) => f.id),
    'SOL',
    4,
  )
}

export async function listarCodigosPrestamo(db = pool) {
  const filas = await consultar(
    'SELECT codigo_prestamo FROM solicitudes WHERE codigo_prestamo IS NOT NULL',
    [],
    db,
  )
  return filas.map((f) => f.codigo_prestamo)
}

export async function insertar(s, db = pool) {
  await consultar(
    `INSERT INTO solicitudes (id, estudiante_id, equipo_id, unidad_id, reserva_id, fecha_inicio,
                              fecha_fin, curso, motivo, estado, motivo_rechazo, codigo_prestamo,
                              creada_en, resuelta_en)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
    [
      s.id,
      s.estudianteId,
      s.equipoId,
      s.unidadId ?? null,
      s.reservaId ?? null,
      s.fechaInicio,
      s.fechaFin,
      s.curso ?? '',
      s.motivo,
      s.estado,
      s.motivoRechazo ?? '',
      s.codigoPrestamo ?? null,
      s.creadaEn,
      s.resueltaEn ?? null,
    ],
    db,
  )
  return buscarPorId(s.id, db)
}

// Campos que los servicios pueden cambiar después de creada la solicitud.
const CAMPOS = [
  'estado',
  'unidadId',
  'fechaFin',
  'motivoRechazo',
  'resueltaEn',
  'resueltaPor',
  'codigoPrestamo',
  'fechaEntregaReal',
  'accesoriosEntregados',
  'detalleAccesorios',
  'observacionesEntrega',
  'entregadaPor',
  'fechaDevolucionReal',
  'estadoRetorno',
  'accesoriosDevueltos',
  'accesoriosFaltantes',
  'descripcionDano',
  'fotoDano',
  'derivadaMantenimiento',
  'observacionesDevolucion',
  'diasRetraso',
  'recibidaPor',
  'devueltaEn',
  'penalidadMonto',
  'penalidadEstado',
  'penalidadCalculadaEn',
  'penalidadPagadaEn',
  'penalidadRecibidoPor',
]
const CAMPOS_JSON = [
  'accesoriosEntregados',
  'detalleAccesorios',
  'accesoriosDevueltos',
  'accesoriosFaltantes',
]

/** Actualiza solo los campos de la lista blanca. `penalidad` se guarda en sus columnas. */
export async function actualizar(id, cambios, db = pool) {
  const { penalidad, ...resto } = cambios
  const plano = { ...resto }
  if (penalidad !== undefined) {
    plano.penalidadMonto = penalidad?.monto ?? null
    plano.penalidadEstado = penalidad?.estado ?? null
    plano.penalidadCalculadaEn = penalidad?.calculadaEn ?? null
    plano.penalidadPagadaEn = penalidad?.pagadaEn ?? null
    plano.penalidadRecibidoPor = penalidad?.recibidoPor ?? null
  }
  const consulta = armarActualizacion('solicitudes', id, plano, CAMPOS, CAMPOS_JSON)
  if (consulta) await consultar(consulta.sql, consulta.parametros, db)
  return buscarPorId(id, db)
}
