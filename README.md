# ITESO-Lover

Plataforma de citas para estudiantes del ITESO. Solo correos `@iteso.mx`.

## Requisito único

Tener **Docker Desktop** instalado y corriendo.

---

## Correr el proyecto

### Paso 1 — Clonar

```bash
git clone https://github.com/M4NU3LiT0/Iteso-Lover.git
cd Iteso-Lover
```

### Paso 2 — Crear el archivo `.env` en la raíz

Este archivo contiene las credenciales de AWS S3 para que funcione la subida de fotos.
Pídelas a un compañero del equipo o al dueño del repo.

```bash
# Crear el archivo .env en la raíz del proyecto (mismo nivel que docker-compose.yml)
# con el siguiente contenido:

AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=iteso-lover-dev
AWS_S3_REGION=us-east-1
```

> Sin este archivo la app funciona (registro, login, mensajes, citas),
> pero la subida de fotos de perfil y galería no estará disponible.

### Paso 3 — Levantar

```bash
docker-compose up --build
```

La primera vez tarda ~3 minutos mientras construye las imágenes.
Las siguientes veces: `docker-compose up` (sin `--build`).

**La app estará en http://localhost:3000**

---

## Poblar la base de datos con perfiles de prueba

Después de levantar el proyecto, en una segunda terminal:

```bash
docker-compose exec backend npm run seed
```

Esto crea **10 perfiles de estudiantes** + **1 cuenta admin**.
Contraseña para todos: `Test1234`

| Email | Rol |
|---|---|
| sofia.ramirez@iteso.mx | Usuario |
| carlos.mendoza@iteso.mx | Usuario |
| valentina.torres@iteso.mx | Usuario |
| ... (10 perfiles en total) | Usuario |
| admin@iteso.mx | Admin |

> El seed solo corre si la base de datos está vacía. Es seguro correrlo varias veces.

---

## Comandos útiles

```bash
docker-compose up --build     # Primera vez
docker-compose up             # Veces siguientes
docker-compose down           # Parar todo
docker-compose down -v        # Parar y borrar base de datos
docker-compose logs -f        # Ver logs en tiempo real
docker-compose exec backend npm run seed  # Poblar BD con datos de prueba
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Tailwind CSS + Zustand |
| Backend | Node.js + Express + Socket.io |
| Base de datos | MongoDB 6 |
| Auth | JWT en httpOnly cookies |
| Archivos | AWS S3 |
| Contenedores | Docker + Docker Compose |

---

## Funcionalidades

| Módulo | Qué hace |
|---|---|
| Auth | Registro/login solo con `@iteso.mx`, JWT httpOnly, lockout tras 5 intentos |
| Perfiles | Editar nombre, carrera, edad, intereses (25 categorías), foto y galería (S3) |
| Descubrir | Swipe de perfiles con filtros por intereses, carrera y rango de edad |
| Citas | Solicitar, aceptar/rechazar y cancelar citas; límite de 5 pendientes por usuario |
| Mensajes | Chat en tiempo real con Socket.io |
| Admin | Panel para ver usuarios, logs de seguridad y reportes |

---

## Seguridad implementada

Se corrigieron **14 vulnerabilidades** clasificadas según **OWASP Top 10 2021** (A01–A09).

- JWT en httpOnly cookies (sin localStorage)
- Refresh token rotation con detección de reuso
- CSRF protection (double-submit cookie)
- Account lockout tras 5 intentos fallidos
- Sanitización XSS en mensajes
- Prevención de NoSQL injection
- Content Security Policy (Helmet)
- Audit logging de eventos de seguridad
- Rate limiting en API y Socket.io (120 req/min)
- Solo correos `@iteso.mx` pueden registrarse

---

## Formato de la API

Todas las respuestas siguen el mismo esquema:

```json
{ "success": true,  "message": "Acción completada", "data": {} }
{ "success": false, "message": "Descripción del error" }
```

Rutas protegidas requieren el middleware `protect`:

```js
router.get('/ruta', protect, controllerFn);
```
