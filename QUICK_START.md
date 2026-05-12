# 🔧 Configuración Final y Quick Start

## 1. Verificar que todo está listo

```bash
# Clonar si no lo has hecho
git clone <repo-url>
cd Iteso-Lover

# Verificar Node.js
node --version  # v16.13.0 o superior
npm --version

# Verificar Docker
docker --version
docker-compose --version
```

## 2. Configurar Variables de Entorno

### Backend (.env)
```bash
cd backend
cp .env.example .env

# Editar .env con:
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/iteso-lover
JWT_SECRET=tu_clave_super_secreta_minimo_32_caracteres_aqui
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# AWS S3 (obtener en AWS Console)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=abc...
AWS_S3_BUCKET_NAME=iteso-lover-bucket
AWS_S3_REGION=us-east-1
```

### Frontend (.env)
```bash
cd ../frontend
cp .env.example .env

# Editar .env con:
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 3. Crear Bucket S3

```bash
# Abrir AWS Console
# Ir a S3 > Create bucket
# Nombre: iteso-lover-bucket
# Región: us-east-1
# Desmarcar "Block all public access"
# Crear

# Agregar esta política al bucket:
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::iteso-lover-bucket/*"
    }
  ]
}
```

## 4. Crear acceso IAM en AWS

```bash
# AWS Console > IAM > Users > Create User
# Nombre: iteso-lover-app
# Agregar inline policy:

{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::iteso-lover-bucket/*"
    }
  ]
}

# Crear Access Key
# Copiar a backend/.env
```

## 5. Configurar MongoDB

### Opción A: MongoDB Atlas (Recomendado)
```bash
# mongodb.com > Create Account > Create Cluster
# Crear usuario: iteso-lover (contraseña fuerte)
# Agregar IP: 0.0.0.0/0 (o tu IP)
# Conectar > Copy connection string
# Reemplazar en backend/.env MONGODB_URI
```

### Opción B: MongoDB Local
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install -y mongodb
sudo systemctl start mongod

# Windows
# Descargar e instalar desde mongodb.com
# O usar Docker: docker run -d -p 27017:27017 mongo
```

## 6. Ejecutar la Aplicación

### Con Docker (Recomendado)
```bash
cd Iteso-Lover
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Acceder
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
# MongoDB: mongodb://localhost:27017
```

### Sin Docker
```bash
# Terminal 1 - Backend
cd backend
npm install
npm run dev
# Usuario test: juan@iteso.mx / Password123

# Terminal 2 - Frontend (nueva terminal)
cd frontend
npm install
npm start
# Abre automáticamente http://localhost:3000
```

## 7. Crear Usuario de Prueba

```bash
# Ir a http://localhost:3000/register
Email: prueba@iteso.mx
Contraseña: PruebaTest123 (debe tener mayús, minús, número)
Género: Hombre
```

## 8. Comandos Útiles

```bash
# Docker
docker-compose ps                    # Ver estado
docker-compose logs -f               # Ver todos los logs
docker-compose down                  # Parar todo
docker-compose restart backend       # Reiniciar backend
docker-compose exec backend npm test # Correr tests

# MongoDB
mongosh                              # Conectar a MongoDB
db.users.find()                      # Ver usuarios
db.messages.find()                   # Ver mensajes
db.dropDatabase()                    # Limpiar BD (⚠️ Cuidado)

# Backend
npm run dev                          # Desarrollo con hot reload
npm start                            # Producción
npm test                             # Tests

# Frontend
npm start                            # Desarrollo
npm run build                        # Build producción
npm test                             # Tests
```

## 9. Troubleshooting

### Puerto 3000/5000 en uso
```bash
# macOS/Linux
lsof -i :5000
kill -9 <PID>

# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Problema: Cannot find module 'express'
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Problema: MongoDB connection refused
```bash
# Verificar que MongoDB está corriendo
docker ps  # Si usas Docker
mongosh    # Si está local

# O si usas Atlas, verificar:
# - IP está en whitelist
# - Contraseña es correcta
# - Connection string es válido
```

### Problema: Foto no sube a S3
```bash
# Verificar:
# 1. AWS credentials son correctas
# 2. Bucket existe y es public
# 3. IAM user tiene permisos S3
# 4. Ver logs: docker-compose logs backend
```

### Problema: Chat no funciona
```bash
# Socket.io necesita:
# 1. Backend escuchando en http://5000
# 2. REACT_APP_SOCKET_URL correcto
# 3. Token JWT válido
# 4. Ver console del navegador (F12)
```

## 10. Deployment Rápido

### Heroku
```bash
# Crear 2 apps: iteso-lover-backend y iteso-lover-frontend

# Backend
cd backend
heroku login
heroku create iteso-lover-backend
heroku config:set MONGODB_URI=<tu-uri>
heroku config:set JWT_SECRET=<tu-secreto>
git push heroku main

# Frontend (en Dockerfile.frontend cambiar comando)
cd ../frontend
heroku create iteso-lover-frontend
heroku config:set REACT_APP_API_URL=https://iteso-lover-backend.herokuapp.com/api
git push heroku main
```

### AWS EC2
```bash
# SSH a la instancia
ssh -i key.pem ubuntu@ip-publica

# Instalar dependencias
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y mongodb

# Clonar y configurar
git clone <repo>
cd Iteso-Lover/backend
npm install
cp .env.example .env  # Editar con valores reales

# Usar PM2
sudo npm install -g pm2
pm2 start server.js --name iteso-backend
pm2 startup
pm2 save
```

## 11. Monitoreo en Producción

```bash
# Ver logs con PM2
pm2 logs iteso-backend

# Ver estado
pm2 status

# Actualizar código
git pull
npm install
pm2 restart iteso-backend

# Backup MongoDB
mongodump --uri "mongodb+srv://..." --out ./backup

# Restaurar
mongorestore --uri "mongodb+srv://..." ./backup
```

## 12. URLs Importantes

```
Frontend:        http://localhost:3000
Backend API:     http://localhost:5000/api
Socket.io:       http://localhost:5000
MongoDB:         mongodb://localhost:27017
Health Check:    http://localhost:5000/api/health

Endpoints Documentados:
- POST /api/auth/register
- POST /api/auth/login
- GET /api/users/profile
- PUT /api/users/profile
- GET /api/users/search
- POST /api/dates/request
- GET /api/dates/requests
- PUT /api/dates/{id}/accept
- PUT /api/dates/{id}/reject
- GET /api/messages/conversations
- GET /api/messages/{userId}
- POST /api/messages/send
- POST /api/upload/profile-photo
- DELETE /api/upload/profile-photo
```

## 13. Estructura de Carpetas

```
Iteso-Lover/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── controllers/     (5 controladores)
│   │   ├── models/          (4 modelos)
│   │   ├── routes/          (5 rutas)
│   │   ├── middleware/      (auth, validación)
│   │   └── utils/           (JWT, validators)
│   ├── server.js
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── pages/           (10 páginas)
│   │   ├── components/      (ProtectedRoute)
│   │   ├── services/        (API calls)
│   │   ├── store/           (Zustand stores)
│   │   ├── styles/          (CSS)
│   │   └── App.jsx
│   ├── public/
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── .dockerignore
├── README.md
├── DEVELOPMENT.md
├── DEPLOYMENT.md
├── FEATURES.md
└── IMPLEMENTATION_SUMMARY.md
```

---

## 🎯 Próximos Pasos Sugeridos

1. **Configurar variables de entorno** (5 min)
2. **Crear bucket S3 y credenciales** (10 min)
3. **Ejecutar con `docker-compose up`** (2 min espera)
4. **Registrar usuario de prueba** (1 min)
5. **Probar cada feature** (30 min)
6. **Reviewar código** (30 min)
7. **Deploy a producción** (según plataforma)

---

## 📞 Ayuda Rápida

Si algo no funciona:
1. Revisar logs: `docker-compose logs -f`
2. Verificar variables de entorno
3. Limpiar y reinstalar: `npm install`
4. Verificar puertos: `lsof -i :5000`
5. Ver consola del navegador (F12)

¡Listo! Ahora puedes ejecutar el proyecto. 🚀
