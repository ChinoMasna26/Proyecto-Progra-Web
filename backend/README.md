# API del Almacén de Equipos

Servicios web REST del sistema de préstamo de equipos: Node.js + Express + PostgreSQL.

## Puesta en marcha

```bash
npm install
cp .env.example .env        # en Windows: copy .env.example .env
npm run db:preparar         # crea las tablas y carga los datos de prueba (src/data)
npm run dev                 # http://localhost:3000/api
npm test                    # pruebas de la API (recargan los datos de prueba)
```

Variables de entorno (`.env`, nunca se sube al repositorio):

| Variable | Para qué |
|---|---|
| `DATABASE_URL` | Cadena de conexión de PostgreSQL (en Neon, «Connection string») |
| `JWT_SECRETO` | Texto largo y aleatorio para firmar los tokens de sesión |
| `PUERTO` | Opcional, por defecto 3000 |
| `ORIGEN_FRONT` | Opcional: dirección del frontend que puede llamar a la API (CORS) |
| `DATABASE_URL_PRUEBAS` | Opcional: otra base para `npm test`, así no se borran tus datos |

## Organización por capas

```
src/
  app.js, servidor.js        Express: CORS, JSON, sesión, módulos y manejo de errores
  config.js                  variables de entorno
  db/                        conexión (pool de pg), esquema SQL y carga de datos de prueba
  comun/                     errores HTTP, sesión con JWT, repositorio compartido de solicitudes
  dominio/                   reglas del negocio: las mismas funciones que usa el frontend
  modulos/huN-*/             una carpeta por historia:
      *.rutas.js             qué URL, qué método y qué permiso
      *.controlador.js       lee la petición y responde (sin SQL)
      *.servicio.js          reglas y validaciones (sin req ni res)
      *.repositorio.js       solo SQL parametrizado (patrón Repository)
      index.js               { prefijo, router }: el cargador lo registra solo
```

Cada historia es dueña de sus tablas y es la única que escribe en ellas. Si necesita datos
de otra, llama al **servicio** de esa historia (por ejemplo, la HU-4 marca la unidad como
prestada con `cambiarEstadoUnidad` de la HU-2), nunca a su tabla.

## Códigos HTTP

`200` correcto · `201` creado · `401` sin sesión · `403` sin permiso · `404` no existe ·
`409` choca con el estado actual (código repetido, fechas ocupadas, ya resuelta) ·
`410` enlace vencido · `422` datos inválidos (con `errores` por campo) · `429` demasiados
intentos · `500` error inesperado.

## Servicios

La sesión va en la cabecera `Authorization: Bearer <token>` (la devuelve `POST /api/cuentas/sesion`).

### HU-1 · Cuenta y acceso — `/api/cuentas`
| Método | Ruta | Permiso | Vista |
|---|---|---|---|
| POST | `/sesion` | público | 1.2 iniciar sesión |
| POST | `/estudiantes` | público | 1.3 registro de estudiante |
| POST | `/encargados` | público | 1.4 alta de encargado |
| POST | `/verificacion` | público | verificar la cuenta |
| POST | `/recuperacion` | público | 1.5 pedir enlace |
| GET / POST | `/recuperacion/:token` | público | 1.5 revisar enlace / nueva contraseña |
| GET / PATCH | `/yo` | sesión | 1.6 mi cuenta |
| PUT | `/yo/contrasena` | sesión | 1.6 cambiar contraseña |
| GET | `/yo/resumen-prestamos` | sesión | 1.6 resumen |
| GET | `/usuarios` | encargado | datos públicos de los usuarios |

### HU-2 · Inventario — `/api/inventario`
| Método | Ruta | Permiso | Vista |
|---|---|---|---|
| GET | `/equipos?categoria&estado&texto&orden&pagina` | encargado | 2.1 listado |
| GET | `/resumen`, `/claves`, `/codigos` | encargado | contadores y datos para validar |
| GET | `/equipos/:id` | encargado | 2.3 detalle con unidades e historial |
| POST / PUT / DELETE | `/equipos`, `/equipos/:id` | encargado | 2.2 registrar, editar, eliminar |
| PUT | `/equipos/:id/condiciones` | encargado | 2.5 condiciones del préstamo |
| POST | `/equipos/:id/unidades` | encargado | 2.3 alta de unidad |
| PUT / DELETE | `/unidades/:id` | encargado | editar o eliminar unidad |
| PATCH | `/unidades/:id/estado` | encargado | 2.4 cambio de estado con motivo |
| GET | `/publico/equipos/:id` | público | 2.6 ficha pública |
| GET | `/con-unidades` | público | lectura para otras historias |
| GET | `/categorias` | público | categorías con cuántos equipos tiene cada una |

### HU-3 · Catálogo y solicitud — `/api/catalogo`
| Método | Ruta | Permiso | Vista |
|---|---|---|---|
| GET | `/equipos?categorias&disponibilidad&duracion&texto&orden&pagina` | público | 3.1 catálogo |
| GET | `/equipos/:id` | público | 3.2 ficha |
| GET | `/equipos/:id/disponibilidad?inicio&fin` | público | 3.3 fechas libres |
| GET | `/solicitudes/mias` | estudiante | 3.4 mis solicitudes |
| POST | `/solicitudes` | estudiante | 3.3 solicitar |
| POST | `/solicitudes/:id/retiro` | estudiante | 3.4 retirar |

### HU-4 · Aprobación y entrega — `/api/prestamos`
| Método | Ruta | Permiso | Vista |
|---|---|---|---|
| GET | `/bandeja?estado&equipoId&desde&hasta&texto&pagina` | encargado | 4.1 bandeja |
| GET | `/contadores` | encargado | menú lateral |
| GET / POST | `/solicitudes/:id/aprobacion` | encargado / encargado activo | 4.2 aprobar |
| POST | `/solicitudes/:id/rechazo` | encargado activo | 4.3 rechazar |
| GET / POST | `/solicitudes/:id/entrega` | encargado / encargado activo | 4.4 entrega |
| GET | `/constancias/:codigo` | sesión | 4.5 constancia |
| GET | `/vigentes` | encargado | 4.6 vigentes |

### HU-5 · Devoluciones — `/api/devoluciones`
| Método | Ruta | Permiso | Vista |
|---|---|---|---|
| GET | `/por-devolver` | encargado | 5.1 lista |
| GET | `/prestamos/:codigo` | encargado | 5.1 buscar préstamo |
| POST | `/prestamos/:codigo/devolucion` | encargado activo | 5.1 y 5.2 registrar |
| GET / POST | `/prestamos/:codigo/renovacion` | encargado / encargado activo | 5.3 renovar |
| GET | `/estudiantes/:id/historial` | sesión (el estudiante, solo el suyo) | 5.4 historial |
| POST | `/estudiantes/:id/pago` | encargado activo | 5.4 registrar pago |

### HU-6 · Reservas — `/api/reservas`
| Método | Ruta | Permiso | Vista |
|---|---|---|---|
| GET | `/equipos`, `/ocupacion` | sesión | 6.1 calendario |
| GET | `/mias` | sesión | 6.3 mis reservas |
| GET | `/espera/mias` | estudiante | 6.4 mi lista de espera |
| GET | `/espera` | encargado | 6.4 cola por equipo |
| POST | `/` | estudiante | 6.2 reservar |
| POST | `/:id/cancelacion` | estudiante | 6.3 cancelar |
| POST | `/conversiones` | sesión | 6.5 reservas próximas → solicitudes |
