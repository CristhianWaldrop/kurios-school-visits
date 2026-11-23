# Registro de visitas a colegios

Aplicación web para que un equipo de especialistas registre y consulte las visitas que realiza a colegios para acompañar a los docentes.
Prueba técnica de Kurios Education (Desarrollador Fullstack).

- **Backend:** Python, Django 5.2 LTS y Django REST Framework.
- **Frontend:** React, Vite, TypeScript y SASS.
- **Base de datos:** PostgreSQL (SQLite como alternativa local).
- **Infraestructura:** Docker Compose.

## Estado del proyecto

El proyecto avanza por fases.

- [x] Fase 0: croquis del monorepo, Docker, documentación y tooling
- [x] Fase 1: modelos del dominio y admin de Django
- [x] Fase 2: seeds
- [x] Fase 3: autenticación de la API
- [x] Fase 4: API de visitas
- [ ] Fase 5: fundamentos del frontend (login y rutas)
- [ ] Fase 6: pantallas de visitas
- [ ] Fase 7: cierre y revisión final

Las secciones de este documento que describen funcionalidad futura lo indican expresamente.

## Contenido

- [Estructura del repositorio](#estructura-del-repositorio)
- [Cómo ejecutar el proyecto](#cómo-ejecutar-el-proyecto)
- [Variables de entorno](#variables-de-entorno)
- [Admin de Django](#admin-de-django)
- [Datos iniciales (seeds)](#datos-iniciales-seeds)
- [Modelo de datos](#modelo-de-datos)
- [Arquitectura](#arquitectura)
- [API](#api)
- [Tests y calidad de código](#tests-y-calidad-de-código)
- [Decisiones técnicas](#decisiones-técnicas)
- [Qué quedó fuera y mejoras futuras](#qué-quedó-fuera-y-mejoras-futuras)
- [Uso de inteligencia artificial](#uso-de-inteligencia-artificial)

## Estructura del repositorio

```
.
├── backend/                  API en Django
│   ├── config/               settings, URLs raíz y WSGI
│   ├── apps/
│   │   ├── core/             utilidades compartidas y health check
│   │   ├── accounts/         especialistas y autenticación
│   │   ├── directory/        colegios y docentes
│   │   └── visits/           visitas
│   ├── requirements/         base.txt (producción) y dev.txt (tests y lint)
│   ├── Dockerfile
│   └── entrypoint.sh         migraciones al iniciar el contenedor
├── frontend/                 SPA en React
│   ├── src/
│   │   ├── app/              componente raíz y providers
│   │   ├── api/              cliente HTTP y funciones por endpoint
│   │   ├── features/         una carpeta por funcionalidad
│   │   ├── styles/           variables y estilos globales (SASS)
│   │   └── test/             utilidades de test
│   ├── Dockerfile            build con Node y servidor nginx
│   └── nginx.conf            sirve la SPA y hace proxy de /api, /admin y /static
├── docker-compose.yml
├── CLAUDE.md                 reglas y convenciones del proyecto
└── README.md
```

## Cómo ejecutar el proyecto

### Opción recomendada: Docker

Es la forma más rápida y no requiere instalar Python, Node ni PostgreSQL. Solo necesitas [Docker](https://docs.docker.com/get-docker/) con Docker Compose.

```bash
docker compose up --build
```

| Servicio       | URL                                                    |
| -------------- | ------------------------------------------------------ |
| Aplicación web | http://localhost:3000                                  |
| API            | http://localhost:3000/api/ (o http://localhost:8000/api/) |
| Admin Django   | http://localhost:3000/admin/                           |

Al iniciar, el contenedor del backend aplica las migraciones y carga los [datos iniciales](#datos-iniciales-seeds) (controlado por `SEED_ON_START`), de modo que la aplicación arranca con colegios, docentes, especialistas y visitas de ejemplo.

Comandos útiles:

```bash
docker compose exec backend pytest        # tests del backend
docker compose logs -f backend            # logs del backend
docker compose down                       # detener
docker compose down -v                    # detener y borrar la base de datos
```

Si los puertos 3000 u 8000 están ocupados, cámbialos con `FRONTEND_PORT` y `BACKEND_PORT` (ver [Variables de entorno](#variables-de-entorno)).

### Ejecución local

> Recomendamos usar Docker. La ejecución local es útil para desarrollar con recarga en caliente.

Requisitos: Python 3.12 o superior, Node.js 22 o superior y npm.

**Backend** (en una terminal):

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements/dev.txt
cp .env.example .env               # Windows PowerShell: Copy-Item .env.example .env
python manage.py migrate
python manage.py seed_data         # datos iniciales (ver "Datos iniciales")
python manage.py runserver
```

El backend queda en http://localhost:8000. Por defecto usa SQLite (`backend/db.sqlite3`), así que no necesitas PostgreSQL.
Para usar PostgreSQL, descomenta y ajusta `DATABASE_URL` en `backend/.env`.

**Frontend** (en otra terminal):

```bash
cd frontend
npm install
npm run dev
```

El frontend queda en http://localhost:5173. Vite hace proxy de `/api`, `/admin` y `/static` hacia el backend (por defecto `http://localhost:8000`).

## Variables de entorno

**Docker** (`.env` en la raíz; opcional, todas tienen valor por defecto, ver [.env.example](.env.example)):

| Variable                      | Descripción                                   | Por defecto                                 |
| ----------------------------- | --------------------------------------------- | ------------------------------------------- |
| `POSTGRES_DB`                 | Nombre de la base de datos                    | `school_visits`                             |
| `POSTGRES_USER`               | Usuario de la base de datos                   | `school_visits`                             |
| `POSTGRES_PASSWORD`           | Contraseña de la base de datos                | `school_visits`                             |
| `DJANGO_SECRET_KEY`           | Clave secreta de Django                       | clave insegura de demostración              |
| `DJANGO_ALLOWED_HOSTS`        | Hosts permitidos, separados por coma          | `localhost,127.0.0.1,backend`               |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Orígenes confiables para CSRF                 | `http://localhost:3000,http://localhost:8000` |
| `DJANGO_TIME_ZONE`            | Zona horaria (define qué fecha es "hoy")      | `America/Caracas`                           |
| `SEED_ON_START`               | Cargar datos iniciales al iniciar el backend  | `true`                                      |
| `BACKEND_PORT`                | Puerto publicado del backend                  | `8000`                                      |
| `FRONTEND_PORT`               | Puerto publicado del frontend                 | `3000`                                      |

**Backend local** (`backend/.env`, ver [backend/.env.example](backend/.env.example)):

| Variable                      | Descripción                                          |
| ----------------------------- | ---------------------------------------------------- |
| `DJANGO_DEBUG`                | `True` en desarrollo local                           |
| `DJANGO_SECRET_KEY`           | Obligatoria si `DJANGO_DEBUG` es `False`             |
| `DJANGO_ALLOWED_HOSTS`        | Hosts permitidos                                     |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | Orígenes confiables para CSRF                        |
| `DJANGO_TIME_ZONE`            | Zona horaria (por defecto `America/Caracas`)         |
| `DATABASE_URL`                | `sqlite:///db.sqlite3` o una URL de PostgreSQL       |

**Frontend local** (`frontend/.env`, opcional, ver [frontend/.env.example](frontend/.env.example)): `VITE_API_PROXY_TARGET` indica a qué backend hace proxy el servidor de desarrollo.

## Admin de Django

El admin está en `/admin/` (http://localhost:3000/admin/ con Docker, http://localhost:8000/admin/ en local) y permite gestionar colegios, docentes, especialistas y visitas.

Inicia sesión con el usuario administrador de los [datos iniciales](#datos-iniciales-seeds) (`admin` / `admin12345`) o crea el tuyo:

```bash
python manage.py createsuperuser                              # local (desde backend/)
docker compose exec backend python manage.py createsuperuser  # Docker
```

Para crear un especialista: crea primero el usuario en **Users** y después un registro en **Specialists** que lo enlace.

En el admin, las visitas eliminadas siguen apareciendo (filtro «Deleted at»), y eliminar una visita desde allí también es lógico: se rellena `deleted_at` y la fila se conserva. Para restaurarla, vacía `deleted_at`.

## Datos iniciales (seeds)

La aplicación necesita datos para mostrar algo útil desde el primer arranque. Se cargan con un comando de gestión **idempotente**: se puede ejecutar cuantas veces se quiera y nunca duplica ni pisa datos existentes.

```bash
python manage.py seed_data                               # local (desde backend/)
docker compose exec backend python manage.py seed_data   # Docker
```

- **Con Docker** se ejecuta solo al iniciar el contenedor del backend. Para desactivarlo, define `SEED_ON_START=false`.
- **En local** hay que ejecutarlo a mano después de `migrate`.

**Qué carga:**

| Dato           | Cantidad | Detalle                                                                                       |
| -------------- | -------- | --------------------------------------------------------------------------------------------- |
| Colegios       | 4        | Colegio San Rafael, Unidad Educativa Las Palmas, Colegio Santa Lucía, Unidad Educativa Monte Sinaí |
| Docentes       | 12       | 3 por colegio                                                                                 |
| Especialistas  | 3        | Con usuario para iniciar sesión                                                               |
| Administrador  | 1        | Usuario del admin de Django                                                                   |
| Visitas        | 3        | Una por especialista: 2 visitas en aula y 1 encuentro, de hace 2, 9 y 20 días                 |

Todos los datos son ficticios. Las fechas de las visitas se calculan respecto al día del primer arranque, así que nunca caen en el futuro.

**Usuarios de demostración** (solo para desarrollo; no uses estas credenciales fuera de un entorno local):

| Rol           | Usuario          | Contraseña   | Especialidad   |
| ------------- | ---------------- | ------------ | -------------- |
| Especialista  | `maria.gonzalez` | `demo1234`   | Matemáticas    |
| Especialista  | `carlos.pena`    | `demo1234`   | Lectoescritura |
| Especialista  | `lucia.mendoza`  | `demo1234`   | Ciencias       |
| Administrador | `admin`          | `admin12345` | -              |

**Cómo se comporta al repetirse:**

- Si un registro ya existe, se deja tal cual (por ejemplo, no se restablece una contraseña que hayas cambiado).
- Si eliminas una visita de ejemplo, no se vuelve a crear.
- Todo ocurre en una transacción: si algo falla, no queda nada a medias.

Para volver al estado inicial por completo en Docker: `docker compose down -v` y luego `docker compose up --build`.

El código está en un módulo `seeds.py` por app (`directory`, `accounts` y `visits`) y el comando que los orquesta está en `backend/apps/visits/management/commands/seed_data.py`.

## Modelo de datos

Los nombres de tablas y columnas están en inglés; Django prefija cada tabla con el nombre de su app (por ejemplo `directory_school`).

```mermaid
erDiagram
    USER ||--o| SPECIALIST : "has profile"
    SCHOOL ||--o{ TEACHER : employs
    SCHOOL ||--o{ VISIT : receives
    TEACHER ||--o{ VISIT : "is observed in"
    SPECIALIST ||--o{ VISIT : registers

    USER {
        bigint id PK
        string username UK
        string password
        string first_name
        string last_name
        string email
        boolean is_staff
        boolean is_active
    }
    SPECIALIST {
        bigint id PK
        bigint user_id FK "unique"
        string specialty
        datetime created_at
        datetime updated_at
    }
    SCHOOL {
        bigint id PK
        string name UK
        string city
        datetime created_at
        datetime updated_at
    }
    TEACHER {
        bigint id PK
        bigint school_id FK
        string first_name
        string last_name
        datetime created_at
        datetime updated_at
    }
    VISIT {
        bigint id PK
        bigint school_id FK
        bigint teacher_id FK
        bigint specialist_id FK
        date visit_date
        string visit_type "classroom_visit | meeting"
        text observations
        datetime deleted_at "null = active"
        datetime created_at
        datetime updated_at
    }
```

Reglas:

- Un docente pertenece a un colegio y una visita referencia a ese colegio y a uno de sus docentes. La base de datos no puede expresar esa coherencia, así que la valida `Visit.clean()`.
- `visit_type` solo admite `classroom_visit` (visita en aula) y `meeting` (encuentro). Lo garantiza una restricción `CHECK` en la base de datos.
- `observations` no puede estar vacío (restricción `CHECK`).
- `visit_date` no puede ser futura. Se valida en `Visit.clean()` comparando con la fecha de hoy en la zona horaria `DJANGO_TIME_ZONE`.
- Un docente no puede repetirse (mismo nombre y apellido) dentro de un colegio, y el nombre del colegio es único.
- Los colegios, docentes y especialistas con visitas asociadas no se pueden borrar (`PROTECT`).
- La eliminación de visitas es lógica: se rellena `deleted_at` y la fila se conserva. `Visit.objects` (manager por defecto, también usado en las relaciones como `school.visits`) excluye las eliminadas; `Visit.all_objects` las incluye.
- `USER` es el modelo de autenticación de Django; `SPECIALIST` es el perfil de dominio asociado a cada usuario especialista.

## Arquitectura

```mermaid
flowchart LR
    subgraph Browser
        SPA[React SPA]
    end
    subgraph Docker Compose
        NGINX[frontend: nginx]
        API[backend: Django + DRF + gunicorn]
        DB[(db: PostgreSQL)]
    end

    SPA -->|"estáticos"| NGINX
    SPA -->|"/api, /admin (cookie de sesión + CSRF)"| NGINX
    NGINX -->|"proxy"| API
    API --> DB
```

- La SPA llama siempre a rutas relativas (`/api/...`). En Docker, nginx hace de proxy hacia el backend; en desarrollo lo hace el servidor de Vite. Al ser el mismo origen, las cookies de sesión y el token CSRF funcionan sin configurar CORS.
- El backend separa responsabilidades por app (`accounts`, `directory`, `visits`), con serializers para validar, vistas delgadas para HTTP y queries en managers/querysets.
- El frontend se organiza por funcionalidad (`features/`), con la capa `api/` como único lugar que conoce el formato de red y TanStack Query para el estado del servidor.

## API

Todos los endpoints exigen una sesión de **especialista** salvo los marcados como públicos. Un usuario sin perfil de especialista (por ejemplo `admin`) no puede iniciar sesión en la API.

| Método | Ruta                | Acceso   | Descripción                                          |
| ------ | ------------------- | -------- | ---------------------------------------------------- |
| GET    | `/api/health/`      | Público  | Estado del servicio                                  |
| GET    | `/api/auth/csrf/`   | Público  | Fija la cookie `csrftoken` (204)                     |
| POST   | `/api/auth/login/`  | Público  | Inicia sesión con `username` y `password`            |
| POST   | `/api/auth/logout/` | Sesión   | Cierra la sesión (204)                               |
| GET    | `/api/schools/`     | Sesión   | Colegios (sin paginar, ordenados por nombre)         |
| GET    | `/api/teachers/`    | Sesión   | Docentes (sin paginar); filtro `?school=<id>`        |
| GET    | `/api/visits/`      | Sesión   | Visitas, paginadas; filtros `?school=<id>&visit_type=<tipo>` |
| POST   | `/api/visits/`      | Sesión   | Registra una visita (201)                            |
| GET    | `/api/visits/{id}/` | Sesión   | Detalle de una visita                                |
| PATCH / PUT | `/api/visits/{id}/` | Autor | Edita una visita (parcial / completa)             |
| DELETE | `/api/visits/{id}/` | Autor    | Eliminación lógica (204)                             |
| GET    | `/api/auth/me/`     | Sesión   | Especialista autenticado                             |

Los endpoints de colegios, docentes y visitas se documentarán aquí al implementarse (Fase 4).

### Autenticación

La API usa la **sesión de Django** (cookie `sessionid`, `HttpOnly`) con protección **CSRF**. El flujo es:

1. `GET /api/auth/csrf/` deja la cookie `csrftoken`.
2. `POST /api/auth/login/` con la cabecera `X-CSRFToken` (el valor de esa cookie) y el cuerpo `{"username": "...", "password": "..."}`. Si es correcto responde `200` con el especialista y crea la sesión.
3. Las siguientes peticiones envían las cookies solas; las que modifican datos (`POST`, `PUT`, `PATCH`, `DELETE`) deben incluir `X-CSRFToken`. Tras el login el token cambia: hay que leer siempre el valor actual de la cookie.
4. `POST /api/auth/logout/` cierra la sesión.

Respuesta de `login` y `me`:

```json
{
  "id": 1,
  "username": "maria.gonzalez",
  "first_name": "María",
  "last_name": "González",
  "full_name": "María González",
  "email": "maria.gonzalez@example.com",
  "specialty": "Matemáticas"
}
```

Códigos de estado:

| Código | Cuándo                                                                               |
| ------ | ------------------------------------------------------------------------------------ |
| 400    | Faltan `username` o `password` (ver [formato de errores](#formato-de-errores))        |
| 401    | Sin sesión, o credenciales inválidas (mismo mensaje para usuario inexistente, contraseña errónea, usuario inactivo o sin perfil de especialista) |
| 403    | Sesión válida de un usuario que no es especialista, o token CSRF ausente o inválido (`{"code": "csrf_failed"}`) |

Ejemplo con `curl` (usa `curl.exe` en PowerShell):

```bash
curl -c cookies.txt http://localhost:3000/api/auth/csrf/
TOKEN=$(grep csrftoken cookies.txt | awk '{print $7}')
curl -b cookies.txt -c cookies.txt -H "X-CSRFToken: $TOKEN" -H "Content-Type: application/json" \
  -d '{"username": "maria.gonzalez", "password": "demo1234"}' http://localhost:3000/api/auth/login/
curl -b cookies.txt http://localhost:3000/api/auth/me/
```

### Visitas

**Permisos.** Cualquier especialista autenticado puede ver todas las visitas. Solo quien registró una visita puede editarla o eliminarla (`403` para los demás). El especialista autor se toma de la sesión y no se puede elegir ni cambiar desde el cliente.

**Listado** (`GET /api/visits/`): ordenado de la visita más reciente a la más antigua y sin las eliminadas. Está paginado con `page` y `page_size` (10 por defecto, máximo 50):

```json
{
  "count": 3,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "school": { "id": 1, "name": "Colegio San Rafael", "city": "Maracaibo" },
      "teacher": { "id": 1, "school": 1, "first_name": "Ana", "last_name": "Rojas", "full_name": "Ana Rojas" },
      "specialist": { "id": 1, "full_name": "María González" },
      "visit_date": "2026-11-20",
      "visit_type": "classroom_visit",
      "observations": "La docente organizó el repaso de fracciones...",
      "created_at": "2026-11-22T18:15:00-04:00",
      "updated_at": "2026-11-22T18:15:00-04:00"
    }
  ]
}
```

Los filtros se pueden combinar: `GET /api/visits/?school=1&visit_type=meeting`. Un valor inexistente responde `400`.

**Alta y edición** (`POST`, `PUT`, `PATCH`). La respuesta usa el mismo formato que el listado. El cuerpo se envía con identificadores (`school_id`, `teacher_id`), mientras que la lectura devuelve los objetos anidados:

```json
{
  "school_id": 1,
  "teacher_id": 1,
  "visit_date": "2026-11-20",
  "visit_type": "classroom_visit",
  "observations": "Texto de la observación"
}
```

Tipos de visita (`visit_type`): `classroom_visit` (visita en aula) y `meeting` (encuentro).

**Reglas de validación** (se aplican en el servidor):

| Campo                 | Regla                                              | Código de error         |
| --------------------- | -------------------------------------------------- | ----------------------- |
| Todos                 | Obligatorios al crear y en `PUT`                   | `required`              |
| `observations`        | No puede estar vacío ni ser solo espacios          | `blank`                 |
| `visit_date`          | Fecha válida (`AAAA-MM-DD`)                        | `invalid`               |
| `visit_date`          | No puede ser futura (hoy sí es válido)             | `future_date`           |
| `visit_type`          | Debe ser uno de los tipos válidos                  | `invalid_choice`        |
| `school_id`, `teacher_id` | Deben existir                                  | `does_not_exist`        |
| `teacher_id`          | El docente debe pertenecer al colegio elegido (también al editar solo uno de los dos) | `teacher_not_in_school` |

**Eliminación** (`DELETE`). Es lógica: responde `204`, se rellena `deleted_at` y la visita deja de aparecer en el listado y en el detalle (`404`), pero la fila se conserva en la base de datos.

### Formato de errores

Todos los errores incluyen un código estable que el frontend traduce al español. El mensaje en inglés viaja solo como respaldo.

Errores de validación (`400`): un arreglo por campo, cada uno con `code` y `message`:

```json
{
  "detail": "Invalid input.",
  "errors": {
    "visit_date": [{ "code": "future_date", "message": "The visit date cannot be in the future." }],
    "teacher_id": [{ "code": "teacher_not_in_school", "message": "The teacher does not belong to the selected school." }]
  }
}
```

Resto de errores: `{"detail": "...", "code": "..."}`, con los códigos `not_authenticated` (401), `invalid_credentials` (401), `permission_denied` (403), `csrf_failed` (403) y `not_found` (404).

## Tests y calidad de código

**Backend** (desde `backend/`, con el entorno virtual activo):

```bash
pytest                                  # tests
ruff check . && ruff format --check .   # lint y formato
```

Los tests usan SQLite en memoria salvo que se defina `DATABASE_URL` (en Docker corren contra PostgreSQL).

**Frontend** (desde `frontend/`):

```bash
npm test                  # tests (Vitest + Testing Library)
npm run lint              # ESLint
npm run format:check      # Prettier
npm run typecheck         # TypeScript estricto
npm run build             # build de producción
```

## Decisiones técnicas

- **Vite en lugar de Next.js.** Es una SPA que consume una API propia, sin SSR ni SEO. Vite es más simple, rápido y suficiente.
- **TypeScript en modo estricto**, sin `any`, y ESLint + Prettier. Se usa TypeScript 6.0 y no 7.0 porque `typescript-eslint` aún no lo soporta.
- **Django 5.2 LTS.** Versión de soporte extendido, preferible a la última versión no LTS para un proyecto que se va a mantener.
- **PostgreSQL con alternativa SQLite.** Docker usa PostgreSQL; en local, `DATABASE_URL` permite usar SQLite y arrancar sin instalar nada.
- **Autenticación por sesión de Django con CSRF.** No hay tokens en JavaScript, se reutiliza el sistema de usuarios del admin y, al ser same-origin, no requiere CORS.
- **Eliminación lógica con `deleted_at`.** Conserva el historial y permite saber cuándo se eliminó, a diferencia de un booleano.
- **Reglas de negocio en el backend**, validación del cliente solo para respuesta rápida.
- **TanStack Query** para el estado del servidor: caché, carga, errores e invalidación tras mutaciones.
- **SASS con CSS Modules** y variables de diseño centralizadas.
- **Variables de entorno con valores por defecto funcionales**, para que `docker compose up --build` funcione sin configurar nada.

## Qué quedó fuera y mejoras futuras

Se completará al cierre del proyecto. Candidatas, ordenadas por valor:

- Documentación OpenAPI interactiva.
- Integración continua (tests y linters en cada push).
- Permisos finos por especialista.
- Límite de intentos de inicio de sesión.
- Cookies `Secure` y cabeceras HTTPS para un despliegue con TLS (hoy se sirve por HTTP en `localhost`).
- Filtro por rango de fechas y búsqueda en observaciones.
- Pruebas end to end.

## Uso de inteligencia artificial

Esta sección se actualiza con cada fase del desarrollo.

**Herramienta utilizada:** Claude Code (asistente de programación de Anthropic) integrado en VS Code.

**Cómo trabajamos.** Usé la IA como acelerador de código. **Todas las decisiones de arquitectura y de producto las tomé yo**: la IA me presentó opciones y recomendaciones, y yo elegí, ajusté o descarté cada una. Dividí el reto en fases. En cada una la IA escribió el código y los tests, y ejecutó tests, linters y pruebas contra la aplicación en marcha. Yo revisé el resultado antes de cada commit. Las reglas de trabajo (todo en inglés, pocos comentarios, tests por cada cambio, solo yo hago commits y push) están escritas en [CLAUDE.md](CLAUDE.md), que la IA lee al empezar.

**Decisiones que tomé yo** (la IA no las tomó por mí):

- **Stack y ejecución:** Vite y React en lugar de Next.js, Django con Django REST Framework, PostgreSQL con SQLite como alternativa local, y poder ejecutar el proyecto tanto en local como con Docker.
- **Modelo de datos:** colegios, docentes, especialistas y visitas, sus restricciones y la eliminación lógica.
- **Producto:** añadir el modelo de especialista y la autenticación de especialistas (más allá del enunciado), los datos de demostración, que todo el frontend esté en español y la zona horaria `America/Caracas`.
- **Permisos:** todos los especialistas ven las visitas y solo el autor las edita o elimina.
- **Contrato de errores:** el backend devuelve códigos y el frontend los traduce al español.
- **Proceso:** usar los generadores oficiales de Django y Vite, trabajar por fases, y las reglas de [CLAUDE.md](CLAUDE.md).

**En qué partes la IA escribió código** (a partir de las decisiones anteriores):

- **Croquis del monorepo:** generado con los comandos oficiales (`django-admin startproject`, `startapp` y `create-vite`) y adaptado después con configuración por entorno, Docker, tooling y documentación inicial.
- **Modelos y admin:** modelos, migraciones, registro en el admin de Django, factories y tests.
- **Seeds:** comando `seed_data` idempotente con los datos de demostración, y sus tests.
- **Autenticación de la API:** login, logout y `me` con sesión y CSRF, permisos y tests.
- **API de visitas:** endpoints, filtros, paginación, validaciones, permisos de autoría, formato de errores y tests.
- **Documentación:** el README y `CLAUDE.md`.
- Las fases del frontend se añadirán aquí cuando se completen.

**Qué tuve que corregir de lo que generó:**

- La primera versión del croquis se escribió a mano en lugar de usar los generadores oficiales; la rehice con `django-admin` y `create-vite`.
- `npm create vite@latest -- --template react-ts` generó en PowerShell un proyecto sin React (el wrapper de npm no pasó bien la plantilla); se resolvió con `npx create-vite@latest frontend --template react-ts --eslint`.
- Se intentó usar TypeScript 7, incompatible con `typescript-eslint`; se fijó la serie 6.0.
- Se eligió Django 5.2 LTS en lugar de la última versión disponible (6.1), por ser LTS.
- Una regla de lint (`RUF012`) producía falsos positivos con las clases de DRF y se desactivó.
- El contenedor del backend mostraba un error de permisos en los logs de gunicorn porque el usuario se creaba sin directorio personal; se corrigió en el `Dockerfile`.
- Los tests del admin fallaban por el almacenamiento de estáticos de producción y tardaban más de 30 segundos por el hash de contraseñas; ambos se ajustaron solo para el entorno de tests.
- Al revisar el admin salió a la vista que la zona horaria por defecto (`UTC`) dejaría registrar el día siguiente a ciertas horas; se cambió a `America/Caracas`.
- Un import circular al registrar el permiso por defecto de la API; se resolvió moviendo imports que solo servían para tipado.
- Para la documentación se afirmaron comportamientos (restaurar una visita desde el admin y que el seed corre en una transacción) que no tenían test; se escribieron esos tests para respaldarlos.
- Un test del seed comprobaba de forma demasiado débil que no se creaba nada nuevo; se reforzó.

**Cómo lo controlé:**

- **Todos los commits y push los hago yo.** La IA tiene prohibido hacerlos y me deja el código listo, con un mensaje de commit sugerido.
- **Reviso cada cambio** antes de confirmarlo.
- **Pruebo manualmente todos los casos en mi ambiente local**, fase por fase: el admin con los datos de demostración, las validaciones, la eliminación lógica y los endpoints de la API.
- **Verificación automática:** tests y linters en cada fase, ejecutados tanto con SQLite como dentro de Docker contra PostgreSQL. Para la API de visitas, además, un recorrido completo por HTTP real contra los contenedores y una comprobación de que los tests detectan fallos introducidos a propósito (borrado real en lugar de lógico y permisos de autoría desactivados).
