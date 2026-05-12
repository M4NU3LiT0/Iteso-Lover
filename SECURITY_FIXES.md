# Security Fixes — ITESO-Lover

Documento de correcciones de seguridad implementadas en el proyecto.  
Fecha: 2026-05-11 | Materia: Software Seguro

---

## Resumen ejecutivo

Se identificaron y corrigieron **14 vulnerabilidades** clasificadas según OWASP Top 10 2021.  
Las correcciones cubren autenticación, autorización, inyección, criptografía, configuración y logging.

---

## 1. Tokens JWT en localStorage → httpOnly Cookies

| Campo | Detalle |
|---|---|
| **OWASP** | A02:2021 – Cryptographic Failures |
| **Severidad** | Crítica |
| **Archivos** | `auth.controller.js`, `middleware/auth.js`, `frontend/store/authStore.js`, `frontend/services/api.js` |

**Problema:**  
Los tokens de acceso y refresh se almacenaban en `localStorage`, accesible por cualquier script JS. Un ataque XSS podía robarlos y suplantar la sesión del usuario indefinidamente.

**Fix implementado:**  
- El servidor ahora establece las cookies `access_token` y `refresh_token` con los flags `httpOnly: true`, `sameSite: lax/strict`, `secure: true` (en producción).
- El frontend ya no lee ni almacena tokens — el navegador los envía automáticamente.
- El middleware de autenticación lee el token de la cookie; mantiene el header `Authorization` como fallback solo para compatibilidad con Socket.io.

---

## 2. Protección CSRF (Double-Submit Cookie)

| Campo | Detalle |
|---|---|
| **OWASP** | A01:2021 – Broken Access Control |
| **Severidad** | Alta |
| **Archivos** | `middleware/csrf.js`, `app.js`, `frontend/services/api.js` |

**Problema:**  
Con cookies httpOnly activas, un atacante podía crear una página maliciosa que enviara requests a la API usando las cookies de la víctima (CSRF clásico).

**Fix implementado:**  
- El servidor genera un token aleatorio (32 bytes hex) en una cookie `csrf_token` **no** httpOnly (legible por JS).
- Todas las requests mutantes (POST, PUT, PATCH, DELETE) deben incluir el header `X-CSRF-Token` con el mismo valor.
- El middleware `verifyCsrf` valida que el header coincida con la cookie (double-submit pattern).
- Rutas públicas (`/login`, `/register`, `/forgot-password`) están exentas.

---

## 3. Account Lockout — Bloqueo por intentos fallidos

| Campo | Detalle |
|---|---|
| **OWASP** | A07:2021 – Identification and Authentication Failures |
| **Severidad** | Alta |
| **Archivos** | `models/User.js`, `controllers/auth.controller.js` |

**Problema:**  
No existía límite de intentos de login. Un atacante podía realizar ataques de fuerza bruta o credential stuffing sin restricción a nivel de cuenta (el rate limiting por IP es evasible con proxies).

**Fix implementado:**  
- Se añadieron campos `loginAttempts` y `lockUntil` al modelo `User`.
- Después de **5 intentos fallidos**, la cuenta se bloquea durante **15 minutos**.
- Al bloquear: se registra el evento en `SecurityLog` con severidad `warning`.
- En login exitoso: los contadores se resetean.
- Implementado en métodos `isLocked()` e `incrementLoginAttempts()` en el modelo.

---

## 4. Rotación de Refresh Tokens

| Campo | Detalle |
|---|---|
| **OWASP** | A07:2021 – Identification and Authentication Failures |
| **Severidad** | Alta |
| **Archivos** | `controllers/auth.controller.js`, `utils/jwt.js`, `models/User.js` |

**Problema:**  
El refresh token era válido 30 días sin mecanismo de revocación. Si era robado, el atacante mantenía acceso indefinidamente.

**Fix implementado:**  
- Se añadió campo `refreshTokenVersion` al modelo `User`.
- El payload del refresh token incluye la versión actual del usuario.
- En cada uso del endpoint `/api/auth/refresh`:
  1. Se verifica que la versión del token coincida con la BD.
  2. Se incrementa la versión (invalida el token anterior).
  3. Se emite un nuevo par de tokens.
- Si se detecta reúso (versión no coincide): se incrementa la versión de emergencia, se limpian las cookies y se registra evento `token_reuse_detected` con severidad `critical`.

---

## 5. Flujo de Recuperación de Contraseña

| Campo | Detalle |
|---|---|
| **OWASP** | A07:2021 – Identification and Authentication Failures |
| **Severidad** | Alta |
| **Archivos** | `controllers/auth.controller.js`, `routes/auth.routes.js` |

**Problema:**  
No existía mecanismo para recuperar contraseñas. Los campos `resetPasswordToken` y `resetPasswordExpire` estaban en el modelo pero nunca se usaban.

**Fix implementado:**  
- `POST /api/auth/forgot-password`: genera token seguro (32 bytes, `crypto.randomBytes`), almacena solo el hash SHA-256 en BD, expira en 10 minutos.
- Responde siempre con el mismo mensaje (no revela si el email existe — user enumeration prevention).
- En desarrollo, el token plano se devuelve en la respuesta para facilitar pruebas sin servidor SMTP.
- `POST /api/auth/reset-password/:token`: valida token contra hash, actualiza contraseña, incrementa `refreshTokenVersion` para invalidar sesiones activas.

---

## 6. Sanitización XSS en Mensajes (Stored XSS)

| Campo | Detalle |
|---|---|
| **OWASP** | A03:2021 – Injection |
| **Severidad** | Alta |
| **Archivos** | `controllers/message.controller.js` |

**Problema:**  
El contenido de los mensajes se almacenaba en MongoDB sin sanitizar. Un atacante podía inyectar código HTML/JS que se ejecutaría en el cliente al renderizar el mensaje (Stored XSS).

**Fix implementado:**  
- Se usa el paquete `xss` antes de persistir cualquier mensaje.
- Configuración estricta: `whiteList: {}` elimina **todas** las etiquetas HTML, preservando solo texto plano.
- Validación de longitud (max 1000 chars) y tipo antes de sanitizar.

---

## 7. Inyección NoSQL en Búsqueda de Usuarios

| Campo | Detalle |
|---|---|
| **OWASP** | A03:2021 – Injection |
| **Severidad** | Alta |
| **Archivos** | `controllers/user.controller.js` |

**Problema:**  
El parámetro `q` se usaba directamente en un operador `$regex` de MongoDB sin escapar. Un atacante podía enviar patrones regex maliciosos (ReDoS) o intentar manipular la consulta.

**Fix implementado:**  
```javascript
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const safe = escapeRegex(String(q).slice(0, 50));
filter.$or = [
  { firstName: { $regex: safe, $options: 'i' } },
  ...
]
```
- Se escapan todos los caracteres especiales de regex.
- Se limita la longitud de la query a 50 caracteres.

---

## 8. Autorización en marcado de mensajes como leídos

| Campo | Detalle |
|---|---|
| **OWASP** | A01:2021 – Broken Access Control |
| **Severidad** | Media |
| **Archivos** | `controllers/message.controller.js` |

**Problema:**  
El endpoint `PUT /api/messages/:messageId/read` no verificaba que el usuario fuera el destinatario del mensaje. Cualquier usuario autenticado podía marcar mensajes de otros como leídos.

**Fix implementado:**  
- Se verifica que `message.receiver.toString() === userId` antes de actualizar.
- Si falla la verificación: se registra evento `unauthorized_access` en `SecurityLog`.

---

## 9. Configuración errónea de S3 — ACL pública

| Campo | Detalle |
|---|---|
| **OWASP** | A05:2021 – Security Misconfiguration |
| **Severidad** | Alta |
| **Archivos** | `controllers/upload.controller.js` |

**Problema:**  
Las fotos de perfil se subían con `ACL: 'public-read'`, haciéndolas accesibles públicamente a cualquier persona con la URL (sin autenticación).

**Fix implementado:**  
- Se eliminó el parámetro `ACL: 'public-read'` del upload — los objetos heredan la política del bucket (privada por defecto).
- **Nota:** Para que las imágenes sean accesibles desde el frontend, el siguiente paso es implementar URLs pre-firmadas (`getSignedUrl`) en el endpoint `GET /api/upload/profile-photo/:userId/url` (ya preparado en `getPresignedUrl`).

---

## 10. Eliminación de fotos antiguas en S3

| Campo | Detalle |
|---|---|
| **OWASP** | A05:2021 – Security Misconfiguration |
| **Severidad** | Baja |
| **Archivos** | `controllers/upload.controller.js` |

**Problema:**  
Al subir una nueva foto de perfil, la anterior no se eliminaba de S3, generando archivos huérfanos acumulados indefinidamente.

**Fix implementado:**  
- Antes de subir la nueva foto, se obtiene la URL actual del usuario y se llama a `deleteFromS3()`.
- La eliminación es best-effort (no falla si S3 lanza error) para no bloquear el upload.

---

## 11. Rate Limiting en Socket.io

| Campo | Detalle |
|---|---|
| **OWASP** | A05:2021 – Security Misconfiguration |
| **Severidad** | Media |
| **Archivos** | `server.js` |

**Problema:**  
Los eventos de Socket.io no tenían límite de velocidad. Un cliente malicioso podía enviar mensajes masivos (spam/DoS).

**Fix implementado:**  
- Ventana deslizante de 1 minuto, máximo **30 mensajes** por usuario.
- Si se excede: se emite evento `error` al cliente, el mensaje no se retransmite.
- Al desconectarse el usuario, su entrada en el mapa de rate limit se elimina.

---

## 12. Content Security Policy (CSP) via Helmet

| Campo | Detalle |
|---|---|
| **OWASP** | A05:2021 – Security Misconfiguration |
| **Severidad** | Media |
| **Archivos** | `app.js` |

**Problema:**  
Helmet estaba configurado con valores por defecto. No se definía una CSP explícita ni HSTS.

**Fix implementado:**  
- CSP configurada explícitamente: `defaultSrc: ['self']`, `objectSrc: ['none']`, `frameSrc: ['none']`.
- HSTS habilitado en producción con `maxAge: 31536000` (1 año) e `includeSubDomains`.
- Mensajes de error genéricos en producción (`isProduction` check).

---

## 13. Credenciales hardcodeadas en docker-compose

| Campo | Detalle |
|---|---|
| **OWASP** | A05:2021 – Security Misconfiguration |
| **Severidad** | Crítica |
| **Archivos** | `docker-compose.yml`, `backend/.env.example` |

**Problema:**  
`docker-compose.yml` contenía credenciales por defecto: `MONGO_ROOT_PASSWORD: password`, `JWT_SECRET: your_super_secret_jwt_key_here_change_in_production`.

**Fix implementado:**  
- Todas las credenciales ahora se leen de variables de entorno sin valores por defecto inseguros (`${VAR}` en lugar de `${VAR:-default_insecure}`).
- Se creó `backend/.env.example` documentando cada variable requerida.
- El servidor falla en arranque si faltan variables críticas (validación en `app.js`).

---

## 14. Audit Logging de Eventos de Seguridad

| Campo | Detalle |
|---|---|
| **OWASP** | A09:2021 – Security Logging and Monitoring Failures |
| **Severidad** | Alta |
| **Archivos** | `models/SecurityLog.js`, `utils/auditLogger.js` |

**Problema:**  
No existía registro de eventos de seguridad. Intentos de login fallidos, reúso de tokens y accesos no autorizados pasaban desapercibidos.

**Fix implementado:**  
- Nuevo modelo `SecurityLog` con campos: `userId`, `event`, `ip`, `userAgent`, `details`, `severity`.
- Eventos registrados: `login_success`, `login_failed`, `login_locked`, `logout`, `register`, `password_reset_*`, `token_refresh`, `token_reuse_detected`, `message_sent`, `user_blocked`, `user_reported`, `profile_photo_*`, `unauthorized_access`.
- Función `logSecurityEvent()` que no lanza excepciones (logging nunca debe interrumpir el flujo).
- Índices de BD para consultas eficientes por usuario y severidad.

---

## 15. Sistema de Bloqueo y Reporte de Usuarios

| Campo | Detalle |
|---|---|
| **OWASP** | A01:2021 – Broken Access Control |
| **Severidad** | Media |
| **Archivos** | `controllers/block.controller.js`, `routes/block.routes.js`, `models/User.js` |

**Problema:**  
En una app de citas no existía mecanismo para que los usuarios se protegieran de acoso o comportamiento inapropiado.

**Fix implementado:**  
- `POST /api/users/:id/block` — Bloquea a un usuario (añade a `blockedUsers[]`).
- `DELETE /api/users/:id/block` — Desbloquea.
- `POST /api/users/:id/report` — Genera entrada en `SecurityLog` con severidad `warning` para revisión manual.
- Los usuarios bloqueados son filtrados de los resultados de búsqueda.

---

## Pipeline CI/CD de Seguridad

Archivo: `.github/workflows/security.yml`

| Job | Herramienta | Qué detecta |
|---|---|---|
| `dependency-audit` | `npm audit` | Dependencias con CVEs conocidos |
| `sast` | Semgrep | Patrones inseguros en código fuente (OWASP Top 10, JWT, secrets) |
| `secret-scan` | Gitleaks | Secretos/credenciales commiteadas accidentalmente |
| `container-scan` | Trivy | Vulnerabilidades en imágenes Docker |
| `tests` | Jest + Supertest | Regresiones funcionales en endpoints |

El pipeline se ejecuta en cada push a `main`/`dev` y en Pull Requests.

---

## Tabla resumen

| # | Vulnerabilidad | OWASP | Severidad | Estado |
|---|---|---|---|---|
| 1 | Tokens en localStorage | A02 | Crítica | ✅ Corregido |
| 2 | Sin protección CSRF | A01 | Alta | ✅ Corregido |
| 3 | Sin bloqueo de cuenta | A07 | Alta | ✅ Corregido |
| 4 | Sin rotación de refresh token | A07 | Alta | ✅ Corregido |
| 5 | Sin recuperación de contraseña | A07 | Alta | ✅ Corregido |
| 6 | Stored XSS en mensajes | A03 | Alta | ✅ Corregido |
| 7 | NoSQL Injection en búsqueda | A03 | Alta | ✅ Corregido |
| 8 | IDOR en markAsRead | A01 | Media | ✅ Corregido |
| 9 | S3 fotos con ACL pública | A05 | Alta | ✅ Corregido |
| 10 | Archivos huérfanos en S3 | A05 | Baja | ✅ Corregido |
| 11 | Sin rate limit en Socket.io | A05 | Media | ✅ Corregido |
| 12 | CSP/HSTS no configurados | A05 | Media | ✅ Corregido |
| 13 | Credenciales hardcodeadas | A05 | Crítica | ✅ Corregido |
| 14 | Sin logging de seguridad | A09 | Alta | ✅ Corregido |
| 15 | Sin bloqueo/reporte de usuarios | A01 | Media | ✅ Corregido |
