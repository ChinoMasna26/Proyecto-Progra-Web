-- Esquema de la base de datos del Almacén de Equipos.
--
-- Es el «contrato de datos» del grupo (src/data/CONTRATO-DATOS.md) pasado a tablas.
-- Cada tabla tiene una historia dueña, que es la única que escribe en ella:
--   HU-1  usuarios, tokens_cuenta, intentos_acceso
--   HU-2  categorias, equipos, unidades, historial_estados
--   HU-3  solicitudes (la crea y la retira; la HU-4 y la HU-5 escriben sus propios campos)
--   HU-5  renovaciones
--   HU-6  reservas
-- Las demás historias solo las leen.

DROP TABLE IF EXISTS renovaciones, reservas, solicitudes, historial_estados, unidades,
  equipos, categorias, intentos_acceso, tokens_cuenta, usuarios CASCADE;

-- ------------------------------------------------------------------ HU-1: cuentas

CREATE TABLE usuarios (
  id                TEXT PRIMARY KEY,                       -- US-101 (encargado), US-201 (estudiante)
  rol               TEXT NOT NULL CHECK (rol IN ('estudiante', 'encargado')),
  nombres           TEXT NOT NULL,
  apellidos         TEXT NOT NULL,
  correo            TEXT NOT NULL UNIQUE,
  estado            TEXT NOT NULL CHECK (estado IN ('activo', 'por_verificar', 'pendiente_aprobacion', 'bloqueado')),
  contrasena_hash   TEXT NOT NULL,                          -- bcrypt, nunca texto plano
  codigo            TEXT,                                   -- solo estudiante
  carrera           TEXT,
  ciclo             INTEGER,
  celular           TEXT NOT NULL DEFAULT '',
  deuda_pendiente   NUMERIC(10, 2) NOT NULL DEFAULT 0,      -- la calcula la HU-5
  almacen_asignado  TEXT,                                   -- solo encargado
  anexo             TEXT,
  motivo_bloqueo    TEXT,
  creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en    TIMESTAMPTZ
);

-- Enlaces de verificación y de recuperación (se usan una sola vez y vencen).
CREATE TABLE tokens_cuenta (
  token       TEXT PRIMARY KEY,
  tipo        TEXT NOT NULL CHECK (tipo IN ('verificacion', 'recuperacion')),
  usuario_id  TEXT NOT NULL REFERENCES usuarios (id) ON DELETE CASCADE,
  expira      TIMESTAMPTZ NOT NULL
);

-- Intentos fallidos de inicio de sesión: cinco seguidos bloquean el correo 15 minutos.
CREATE TABLE intentos_acceso (
  correo           TEXT PRIMARY KEY,
  fallidos         INTEGER NOT NULL DEFAULT 0,
  bloqueado_hasta  TIMESTAMPTZ
);

-- --------------------------------------------------------------- HU-2: inventario

-- Categorías del catálogo. Cada equipo pertenece a una (relación uno a muchos).
CREATE TABLE categorias (
  id      TEXT PRIMARY KEY,                                 -- medicion, audiovisual…
  nombre  TEXT NOT NULL UNIQUE                              -- Medición, Audiovisual…
);

CREATE TABLE equipos (
  id                     TEXT PRIMARY KEY,                  -- EQ-001
  nombre                 TEXT NOT NULL,
  marca                  TEXT NOT NULL,
  modelo                 TEXT NOT NULL,
  categoria              TEXT NOT NULL REFERENCES categorias (id),
  descripcion            TEXT NOT NULL DEFAULT '',
  fotografias            JSONB NOT NULL DEFAULT '[]',       -- [{ url, alt }]
  accesorios             JSONB NOT NULL DEFAULT '[]',       -- ["Cable de poder", ...]
  duracion_maxima_dias   INTEGER NOT NULL CHECK (duracion_maxima_dias BETWEEN 1 AND 90),
  requiere_autorizacion  BOOLEAN NOT NULL DEFAULT false,
  admite_renovacion      BOOLEAN NOT NULL DEFAULT false,
  penalidad_por_dia      NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (penalidad_por_dia BETWEEN 0 AND 500),
  es_borrador            BOOLEAN NOT NULL DEFAULT false,
  creado_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Marca + modelo identifican al equipo (sin distinguir mayúsculas).
CREATE UNIQUE INDEX equipos_marca_modelo ON equipos (lower(marca), lower(modelo));

CREATE TABLE unidades (
  id                 TEXT PRIMARY KEY,                      -- UN-0001
  equipo_id          TEXT NOT NULL REFERENCES equipos (id) ON DELETE CASCADE,
  codigo_inventario  TEXT NOT NULL UNIQUE,                  -- INV-OSC-0042
  ubicacion          TEXT NOT NULL,
  observaciones      TEXT NOT NULL DEFAULT '',
  estado             TEXT NOT NULL CHECK (estado IN ('disponible', 'prestada', 'mantenimiento', 'baja')),
  prestamo_vigente   TEXT                                   -- código del préstamo (lo pone la HU-4)
);

CREATE TABLE historial_estados (
  id          SERIAL PRIMARY KEY,
  unidad_id   TEXT NOT NULL REFERENCES unidades (id) ON DELETE CASCADE,
  de          TEXT,                                         -- NULL = alta de la unidad
  a           TEXT NOT NULL,
  motivo      TEXT NOT NULL,
  fecha       TIMESTAMPTZ NOT NULL DEFAULT now(),
  usuario_id  TEXT
);

-- ------------------------------------------------- HU-3, HU-4, HU-5: solicitudes

-- Una solicitud recorre todo el préstamo: la crea la HU-3 (pendiente), la resuelve y la
-- entrega la HU-4 (aprobada, rechazada, en_prestamo) y la cierra la HU-5 (devuelta).
-- equipo_id y unidad_id no son llaves foráneas a propósito: si un equipo se elimina del
-- inventario, el historial de préstamos se conserva («Equipo retirado del inventario»).
CREATE TABLE solicitudes (
  id                        TEXT PRIMARY KEY,               -- SOL-0001
  estudiante_id             TEXT NOT NULL REFERENCES usuarios (id),
  equipo_id                 TEXT NOT NULL,
  unidad_id                 TEXT,
  reserva_id                TEXT,                           -- si nació de una reserva (HU-6)
  fecha_inicio              DATE NOT NULL,
  fecha_fin                 DATE NOT NULL,
  curso                     TEXT NOT NULL DEFAULT '',
  motivo                    TEXT NOT NULL,
  estado                    TEXT NOT NULL CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'retirada', 'en_prestamo', 'devuelta')),
  creada_en                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- HU-4: aprobación, rechazo y entrega
  motivo_rechazo            TEXT NOT NULL DEFAULT '',
  resuelta_en               TIMESTAMPTZ,
  resuelta_por              TEXT,
  codigo_prestamo           TEXT UNIQUE,                    -- PRE-2026-0318
  fecha_entrega_real        TIMESTAMPTZ,
  accesorios_entregados     JSONB,
  detalle_accesorios        JSONB,                          -- [{ nombre, entregado, nota }]
  observaciones_entrega     TEXT,
  entregada_por             TEXT,
  -- HU-5: devolución y penalidad
  fecha_devolucion_real     DATE,
  estado_retorno            TEXT,
  accesorios_devueltos      JSONB,
  accesorios_faltantes      JSONB,
  descripcion_dano          TEXT,
  foto_dano                 TEXT,
  derivada_mantenimiento    BOOLEAN,
  observaciones_devolucion  TEXT,
  dias_retraso              INTEGER,
  recibida_por              TEXT,
  devuelta_en               TIMESTAMPTZ,
  penalidad_monto           NUMERIC(10, 2),
  penalidad_estado          TEXT CHECK (penalidad_estado IN ('pendiente', 'pagada')),
  penalidad_calculada_en    TIMESTAMPTZ,
  penalidad_pagada_en       TIMESTAMPTZ,
  penalidad_recibido_por    TEXT,
  CHECK (fecha_fin >= fecha_inicio)
);
CREATE INDEX solicitudes_estudiante ON solicitudes (estudiante_id);
CREATE INDEX solicitudes_estado ON solicitudes (estado);

-- HU-5: cada renovación de un préstamo vigente.
CREATE TABLE renovaciones (
  id                   SERIAL PRIMARY KEY,
  solicitud_id         TEXT NOT NULL REFERENCES solicitudes (id) ON DELETE CASCADE,
  fecha_fin_anterior   DATE NOT NULL,
  fecha_fin_nueva      DATE NOT NULL,
  dias                 INTEGER NOT NULL,
  fecha                TIMESTAMPTZ NOT NULL DEFAULT now(),
  por                  TEXT
);

-- ----------------------------------------------------------------- HU-6: reservas

CREATE TABLE reservas (
  id              TEXT PRIMARY KEY,                         -- RES-0001
  equipo_id       TEXT NOT NULL,
  unidad_id       TEXT,                                     -- NULL mientras está en espera
  usuario_id      TEXT NOT NULL REFERENCES usuarios (id),
  fecha_inicio    DATE NOT NULL,
  fecha_fin       DATE NOT NULL,
  motivo          TEXT NOT NULL,
  estado          TEXT NOT NULL CHECK (estado IN ('confirmada', 'en_espera', 'convertida', 'cancelada')),
  solicitud_id    TEXT,
  creada_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizada_en  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (fecha_fin >= fecha_inicio)
);
