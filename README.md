# Almacén de Equipos — Sistema de Préstamo de Equipos de Laboratorio

Proyecto del curso Programación Web (Universidad de Lima).

- **Primera entrega:** interfaz en React con los datos en el navegador.
- **Entrega final:** servicios web REST con Node.js y Express (carpeta `backend/`), base de
  datos PostgreSQL con el patrón Repository y la interfaz conectada a la API.

## Cómo ejecutarlo

Requisitos: Node.js 20.19 o superior y una base de datos PostgreSQL (local o gratis en
[Neon](https://neon.tech)).

**1. API (carpeta `backend`)**

```bash
cd backend
npm install
cp .env.example .env      # en Windows: copy .env.example .env
# edita .env: DATABASE_URL (cadena de conexión) y JWT_SECRETO
npm run db:preparar       # crea las tablas y carga los datos de prueba
npm run dev               # API en http://localhost:3000/api
```

**2. Interfaz (carpeta raíz), en otra terminal**

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`. En desarrollo, Vite reenvía `/api` al puerto 3000.

Para volver a los datos de prueba: `npm run db:preparar` dentro de `backend`.
Pruebas de la API: `npm test` dentro de `backend` (ojo: recargan los datos de prueba).

## Cuentas de prueba

Todas usan la contraseña `Clave2026`.

| Correo | Rol | Caso |
|---|---|---|
| `erivas@ulima.edu.pe` | Encargado de almacén | Cuenta activa |
| `jsalinas@ulima.edu.pe` | Encargado de almacén | Pendiente de aprobación |
| `rmendoza@aloe.ulima.edu.pe` | Estudiante | Sin deuda, con solicitudes en todos los estados |
| `ahuaman@aloe.ulima.edu.pe` | Estudiante | Con deuda pendiente |
| `atorres@aloe.ulima.edu.pe` | Estudiante | Cuenta bloqueada |

## Historias de usuario

| Historia | Responsable | Documentación |
|---|---|---|
| HU-1 Cuenta y acceso | Angelo Cano | `docs/HU-1-cuentas.md` |
| HU-2 Inventario | Rodrigo Ventocilla | `docs/HU-2-inventario.md` |
| HU-3 Catálogo y solicitud | Renzo Bendezú | `docs/HU-3-catalogo.md` |
| HU-4 Aprobación y entrega | Diego Licas | `docs/HU-4-prestamos.md` |
| HU-5 Devoluciones | Josh Miranda | `docs/HU-5-devoluciones.md` |
| HU-6 Reserva anticipada | Felipe Madalengoitia | `docs/HU-6-reservas.md` |

## Estructura

El código está organizado por capas; ningún componente de interfaz accede a los datos.

| Carpeta | Contenido |
|---|---|
| `src/pages/`, `src/components/` | Interfaz: vistas y componentes (los comunes en `components/ui` y `components/layout`) |
| `src/context/` | Estado compartido con Context; único punto que llama a los servicios |
| `src/services/` | Cliente de la API: cada función hace `fetch` (con `api.js`) y mantiene la firma de la primera entrega |
| `src/domain/` | Reglas del negocio como funciones puras; el servidor valida con las mismas |
| `src/data/` | Contrato de datos (`CONTRATO-DATOS.md`) y datos semilla que se cargan en la base |
| `backend/` | API REST: rutas → controlador → servicio → repositorio → PostgreSQL. Ver `backend/README.md` |

## Tecnologías

- Interfaz: React 19, React Router 7, Vite 8 y CSS propio.
- Servicios web: Node.js, Express 5, estilo REST.
- Base de datos: PostgreSQL con el driver `pg` y el patrón Repository (SQL parametrizado).
- Seguridad: contraseñas cifradas con bcrypt, sesión con tokens JWT, credenciales en
  variables de entorno (`.env`, que no se sube al repositorio).
- Pruebas: `node:test` y `supertest`.
