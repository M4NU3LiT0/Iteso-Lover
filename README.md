# ITESO-Lover 💕

Plataforma segura de citas para conectar estudiantes del ITESO con intereses y gustos afines. El sistema prioriza la experiencia y conexión del usuario sobre la generación de ganancias.

## 📋 Descripción del Proyecto

ITESO-Lover es una aplicación web interna donde los estudiantes pueden:
- ✅ Registrarse e iniciar sesión con email @iteso.mx
- 🔍 Buscar otros estudiantes por nombre e intereses
- 💌 Solicitar citas seleccionando fecha, hora y lugar
- 📬 Aceptar o rechazar solicitudes de citas
- 📅 Gestionar sus citas programadas
- 🔒 Mantener sus datos seguros

## 🛠 Stack Tecnológico

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** - Base de datos NoSQL
- **JWT** - Autenticación segura
- **Bcryptjs** - Hash de contraseñas
- **AWS S3** - Almacenamiento de archivos

### Frontend
- **React** - Biblioteca de UI
- **React Router** - Enrutamiento
- **Axios** - Cliente HTTP
- **Tailwind CSS** - Estilos
- **Zustand** - Gestión de estado

## 📦 Requisitos Previos

- **Node.js** v16 o superior
- **MongoDB** (local o Atlas)
- **npm** o **yarn**
- Cuenta en **AWS S3** (opcional, para fotos)
- Editor de código (VSCode recomendado)

## 🚀 Instalación y Configuración

### 1. Clonar o Descargar el Proyecto

```bash
cd Iteso-Lover
```

### 2. Configurar Backend

```bash
# Navegar a la carpeta backend
cd backend

# Instalar dependencias
npm install

# Crear archivo .env basado en .env.example
cp .env.example .env

# Configurar variables en .env
# - MONGODB_URI (tu conexión MongoDB)
# - JWT_SECRET (contraseña segura para JWT)
# - AWS credentials (si usas S3)
# - FRONTEND_URL (dirección del frontend)
```

### 3. Configurar Frontend

```bash
# Navegar a la carpeta frontend
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo .env basado en .env.example
cp .env.example .env

# Configurar REACT_APP_API_URL si es necesario
```

### 4. Ejecutar la Aplicación

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# El servidor correrá en http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# La aplicación abrirá en http://localhost:3000
```

## 📚 Estructura del Proyecto

```
iteso-lover/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── models/          # Esquemas MongoDB
│   │   ├── routes/          # Rutas API
│   │   ├── middleware/      # Autenticación, validación
│   │   ├── services/        # Servicios externos
│   │   ├── utils/           # Utilidades
│   │   └── app.js
│   ├── package.json
│   ├── server.js
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/           # Páginas principales
│   │   ├── services/        # Llamadas API
│   │   ├── store/           # Zustand store
│   │   ├── hooks/           # Custom hooks
│   │   ├── styles/          # CSS
│   │   ├── App.jsx
│   │   └── index.js
│   ├── public/              # Assets estáticos
│   ├── package.json
│   └── .env.example
│
└── README.md
```

## 🔐 Medidas de Seguridad Implementadas

✅ **Autenticación JWT** con tokens de acceso y refresco
✅ **Hash de contraseñas** con bcryptjs
✅ **Validación de entrada** y sanitización
✅ **CORS configurado** para proteger origen
✅ **Rate limiting** contra ataques de fuerza bruta
✅ **Helmet** para headers de seguridad
✅ **Validación de email** (@iteso.mx solamente)
✅ **Contraseñas fuertes** (8+ caracteres, mayús, minús, números)
✅ **Datos de usuario protegidos** (PII)

## 📡 Rutas API Principales

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/users/profile` - Obtener perfil actual
- `PUT /api/users/profile` - Actualizar perfil
- `GET /api/users/search?q=nombre` - Buscar usuarios
- `GET /api/users/:id` - Obtener usuario por ID

### Citas
- `POST /api/dates/request` - Crear solicitud de cita
- `GET /api/dates/requests` - Obtener solicitudes pendientes
- `GET /api/dates/scheduled` - Obtener citas programadas
- `PUT /api/dates/request/:id/accept` - Aceptar solicitud
- `PUT /api/dates/request/:id/reject` - Rechazar solicitud

## 🔄 Flujo de Uso

1. **Registro/Login** → Usuario se crea cuenta o inicia sesión
2. **Completar Perfil** → Agrega foto, bio, intereses
3. **Búsqueda** → Encuentra estudiantes similares
4. **Solicitar Cita** → Envía solicitud con fecha/hora/lugar
5. **Notificación** → Otro usuario recibe la solicitud
6. **Responder** → Acepta o rechaza
7. **Gestión** → Ve sus citas agendadas

## 🧪 Testing (Próximamente)

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd ../frontend
npm test
```

## 📞 Soporte

Para dudas o reportes sobre el proyecto, contacta al equipo de desarrollo.

## 📄 Licencia

Proyecto educativo - Software Seguro ITESO

---

**¡Listo para comenzar el desarrollo!** 🎉

Si necesitas ayuda:
1. Revisa la documentación de dependencias
2. Consulta los comentarios en el código
3. Verifica que todos los requisitos previos estén instalados
