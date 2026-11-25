# Almacén de Equipos — Sistema de Préstamo de Equipos de Laboratorio

Proyecto del curso Programación Web (Universidad de Lima). Aplicativo web (front-end) en
React + Vite. Todos los datos vienen de la API REST, que está en su propio repositorio
(Node.js + Express + Sequelize + PostgreSQL).

## Cómo ejecutarlo

Requisitos: Node.js 20.19 o superior y la API corriendo (ver el README del repositorio de la API).

```bash
npm install
npm run dev
```

Abrir `http://localhost:5173`. En desarrollo, Vite reenvía `/api` a `http://localhost:3000`
(la API en local). Para compilar: `npm run build`.

## Despliegue en Vercel

Importar el repositorio en Vercel (Framework: Vite) y agregar la variable de entorno
`VITE_API_URL` con la dirección de la API desplegada (sin `/api` al final). `vercel.json`
hace que al recargar cualquier ruta (`/inventario`, `/catalogo`…) cargue la aplicación.

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
| `src/services/` | Cliente de la API: cada función hace `fetch` (con `api.js`) con async/await |
| `src/domain/` | Reglas del negocio como funciones puras (validaciones de los formularios) |
| `src/data/` | Contrato de datos (`CONTRATO-DATOS.md`) |

## Tecnologías

- React 19 (useState, useEffect, useReducer, Context), React Router 7, Vite 8 y CSS propio.
- Datos desde la API REST con `fetch`, Promises y async/await (`src/services/api.js`).
- Despliegue en Vercel.
