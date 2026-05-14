# ITESO-Lover

Plataforma de citas para estudiantes del ITESO. Solo correos `@iteso.mx`.

## Correr localmente

**Requisito único: tener Docker Desktop instalado y corriendo.**

```bash
git clone https://github.com/M4NU3LiT0/Iteso-Lover.git
cd Iteso-Lover
docker-compose up --build
```

Listo. La app estará en **http://localhost:3000**

- El backend corre en `http://localhost:5000`
- La base de datos (MongoDB) se levanta automáticamente
- Los cambios en el código se reflejan sin reiniciar (hot-reload)

---

## Configuración opcional

El proyecto **no necesita ningún archivo `.env`** para correr en desarrollo.

Si quieres habilitar la subida de fotos (requiere AWS S3) o cambiar los JWT secrets:

```bash
cp .env.example .env
# editar .env con tus valores
docker-compose up --build
```

---

## Stack

| Capa | Tecnología |
|---|---|
| Frontend | React 18 + Tailwind CSS + Zustand |
| Backend | Node.js + Express + Socket.io |
| Base de datos | MongoDB 6 + Mongoose |
| Auth | JWT en httpOnly cookies |
| Tiempo real | Socket.io |
| Archivos | AWS S3 |
| Contenedores | Docker + Docker Compose |

## Rutas principales

```
POST   /api/auth/register          Registro (@iteso.mx)
POST   /api/auth/login             Login
POST   /api/auth/logout            Logout
POST   /api/auth/forgot-password   Solicitar reset de contraseña
POST   /api/auth/reset-password/:token  Resetear contraseña

GET    /api/users/profile          Mi perfil
PUT    /api/users/profile          Actualizar perfil
GET    /api/users/compatible       Usuarios compatibles (por algoritmo)
GET    /api/users/search           Buscar usuarios

POST   /api/photos                 Subir foto a galería
DELETE /api/photos/:id             Eliminar foto
PUT    /api/photos/reorder         Reordenar galería

POST   /api/dates/request          Solicitar cita
PUT    /api/dates/request/:id/accept   Aceptar
PUT    /api/dates/request/:id/reject   Rechazar

GET    /api/messages/conversations Mis conversaciones
GET    /api/messages/:userId       Conversación con usuario
POST   /api/messages/send          Enviar mensaje

POST   /api/users/:id/block        Bloquear usuario
POST   /api/users/:id/report       Reportar usuario

GET    /api/admin/stats            Estadísticas (admin)
GET    /api/admin/users            Listar usuarios (admin)
GET    /api/admin/security-logs    Logs de seguridad (admin)
```

## Seguridad implementada

- JWT en httpOnly cookies (no localStorage)
- Refresh token rotation con detección de reuso
- CSRF protection (double-submit cookie)
- Account lockout tras 5 intentos fallidos
- Sanitización XSS en mensajes
- Prevención de NoSQL injection
- Content Security Policy (Helmet)
- Audit logging de eventos de seguridad
- Rate limiting en API y Socket.io
- Solo correos `@iteso.mx` pueden registrarse
