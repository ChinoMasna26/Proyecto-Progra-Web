/**
 * Crea las tablas y carga los datos de prueba (los mismos archivos semilla de la primera
 * entrega, en src/data). Se corre con `npm run db:preparar`. Borra lo que haya: úsalo
 * para empezar de cero o para restablecer la demo.
 */
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import bcrypt from 'bcryptjs'
import { CATEGORIAS } from '../dominio/catalogos.js'
import { consultar, enTransaccion, pool } from './conexion.js'

const DATOS = new URL('../../../src/data/', import.meta.url)
const leerJson = async (archivo) => JSON.parse(await readFile(new URL(archivo, DATOS), 'utf8'))

// Todas las cuentas de prueba usan esta contraseña (README del proyecto).
const CONTRASENA_DEMO = 'Clave2026'

async function insertar(cliente, tabla, fila) {
  const columnas = Object.keys(fila)
  const marcas = columnas.map((_, i) => `$${i + 1}`)
  await cliente.query(
    `INSERT INTO ${tabla} (${columnas.join(', ')}) VALUES (${marcas.join(', ')})`,
    Object.values(fila),
  )
}

const json = (valor) => (valor === undefined || valor === null ? null : JSON.stringify(valor))

export async function prepararBaseDatos({ silencioso = false } = {}) {
  const esquema = await readFile(new URL('./esquema.sql', import.meta.url), 'utf8')
  const [usuarios, inventario, solicitudes] = await Promise.all([
    leerJson('seed-usuarios.json'),
    leerJson('seed-inventario.json'),
    leerJson('seed-solicitudes.json'),
  ])
  const hash = await bcrypt.hash(CONTRASENA_DEMO, 10)

  await enTransaccion(async (cliente) => {
    await cliente.query(esquema)

    for (const u of usuarios.usuarios)
      await insertar(cliente, 'usuarios', {
        id: u.id,
        rol: u.rol,
        nombres: u.nombres,
        apellidos: u.apellidos,
        correo: u.correo,
        estado: u.estado,
        contrasena_hash: hash,
        codigo: u.codigo ?? null,
        carrera: u.carrera ?? null,
        ciclo: u.ciclo ?? null,
        celular: u.celular ?? '',
        deuda_pendiente: u.deudaPendiente ?? 0,
        almacen_asignado: u.almacenAsignado ?? null,
        anexo: u.anexo ?? null,
        motivo_bloqueo: u.motivoBloqueo ?? null,
        creado_en: u.creadoEn,
      })

    // Las categorías son las mismas del dominio (los valores del desplegable del formulario).
    for (const c of CATEGORIAS)
      await insertar(cliente, 'categorias', { id: c.valor, nombre: c.etiqueta })

    for (const e of inventario.equipos)
      await insertar(cliente, 'equipos', {
        id: e.id,
        nombre: e.nombre,
        marca: e.marca,
        modelo: e.modelo,
        categoria: e.categoria,
        descripcion: e.descripcion ?? '',
        fotografias: json(e.fotografias ?? []),
        accesorios: json(e.accesorios ?? []),
        duracion_maxima_dias: e.condicionesPrestamo.duracionMaximaDias,
        requiere_autorizacion: e.condicionesPrestamo.requiereAutorizacion,
        admite_renovacion: e.condicionesPrestamo.admiteRenovacion,
        penalidad_por_dia: e.condicionesPrestamo.penalidadPorDia,
        es_borrador: Boolean(e.esBorrador),
        creado_en: e.creadoEn,
        actualizado_en: e.actualizadoEn,
      })

    for (const u of inventario.unidades) {
      await insertar(cliente, 'unidades', {
        id: u.id,
        equipo_id: u.equipoId,
        codigo_inventario: u.codigoInventario,
        ubicacion: u.ubicacion,
        observaciones: u.observaciones ?? '',
        estado: u.estado,
        prestamo_vigente: u.prestamoVigente ?? null,
      })
      for (const h of u.historialEstados ?? [])
        await insertar(cliente, 'historial_estados', {
          unidad_id: u.id,
          de: h.de,
          a: h.a,
          motivo: h.motivo,
          fecha: h.fecha,
          usuario_id: h.usuarioId,
        })
    }

    for (const s of solicitudes.solicitudes)
      await insertar(cliente, 'solicitudes', {
        id: s.id,
        estudiante_id: s.estudianteId,
        equipo_id: s.equipoId,
        unidad_id: s.unidadId ?? null,
        reserva_id: s.reservaId ?? null,
        fecha_inicio: s.fechaInicio,
        fecha_fin: s.fechaFin,
        curso: s.curso ?? '',
        motivo: s.motivo,
        estado: s.estado,
        creada_en: s.creadaEn,
        motivo_rechazo: s.motivoRechazo ?? '',
        resuelta_en: s.resueltaEn ?? null,
        resuelta_por: s.resueltaPor ?? null,
        codigo_prestamo: s.codigoPrestamo ?? null,
        fecha_entrega_real: s.fechaEntregaReal ?? null,
        accesorios_entregados: json(s.accesoriosEntregados),
        detalle_accesorios: json(s.detalleAccesorios),
        observaciones_entrega: s.observacionesEntrega ?? null,
        entregada_por: s.entregadaPor ?? null,
        fecha_devolucion_real: s.fechaDevolucionReal ?? null,
        estado_retorno: s.estadoRetorno ?? null,
        accesorios_devueltos: json(s.accesoriosDevueltos),
        accesorios_faltantes: json(s.accesoriosFaltantes),
        descripcion_dano: s.descripcionDano ?? null,
        foto_dano: s.fotoDano ?? null,
        derivada_mantenimiento: s.derivadaMantenimiento ?? null,
        observaciones_devolucion: s.observacionesDevolucion ?? null,
        dias_retraso: s.diasRetraso ?? null,
        recibida_por: s.recibidaPor ?? null,
        devuelta_en: s.devueltaEn ?? null,
        penalidad_monto: s.penalidad?.monto ?? null,
        penalidad_estado: s.penalidad?.estado ?? null,
        penalidad_calculada_en: s.penalidad?.calculadaEn ?? null,
        penalidad_pagada_en: s.penalidad?.pagadaEn ?? null,
        penalidad_recibido_por: s.penalidad?.recibidoPor ?? null,
      })
  })

  if (!silencioso) {
    const [conteo] = await consultar(
      `SELECT (SELECT count(*) FROM usuarios) AS usuarios, (SELECT count(*) FROM categorias) AS categorias,
              (SELECT count(*) FROM equipos) AS equipos,
              (SELECT count(*) FROM unidades) AS unidades, (SELECT count(*) FROM solicitudes) AS solicitudes`,
    )
    console.log('Base de datos lista:', conteo)
  }
}

// Si se ejecuta directamente (npm run db:preparar), prepara y cierra la conexión.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  prepararBaseDatos()
    .catch((error) => {
      console.error('No se pudo preparar la base de datos:', error.message)
      process.exitCode = 1
    })
    .finally(() => pool.end())
}
