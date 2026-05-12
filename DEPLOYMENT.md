# 🚀 Guía de Deployment - ITESO-Lover

## Requisitos Previos
- Git instalado
- Docker y Docker Compose instalados
- Cuenta en AWS S3 (opcional, para fotos)
- Cuenta MongoDB Atlas o MongoDB local
- Node.js v16+ (si ejecutas sin Docker)

## Opción 1: Deployment con Docker Compose (Recomendado)

### 1. Clonar el repositorio
```bash
git clone <url-repositorio>
cd Iteso-Lover
```

### 2. Configurar variables de entorno
```bash
# Crear archivo .env en la raíz
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Editar `backend/.env`:
```env
MONGODB_URI=mongodb://root:password@mongodb:27017/iteso-lover?authSource=admin
NODE_ENV=production
PORT=5000
JWT_SECRET=tu_clave_jwt_muy_segura_aqui
FRONTEND_URL=http://localhost:3000
AWS_ACCESS_KEY_ID=tu_aws_key
AWS_SECRET_ACCESS_KEY=tu_aws_secret
AWS_S3_BUCKET_NAME=iteso-lover-bucket
AWS_S3_REGION=us-east-1
```

Editar `frontend/.env`:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 3. Ejecutar con Docker Compose
```bash
docker-compose up -d
```

Esperar a que todos los servicios inicien:
```bash
docker-compose logs -f backend  # Ver logs del backend
docker-compose logs -f frontend # Ver logs del frontend
```

### 4. Acceder a la aplicación
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- MongoDB: mongodb://localhost:27017

---

## Opción 2: Deployment Local (Sin Docker)

### 1. Backend Setup
```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Configurar variables en .env
# MONGODB_URI, JWT_SECRET, AWS credentials, etc.

# Ejecutar en desarrollo
npm run dev

# O producción
npm start
```

### 2. Frontend Setup (Nueva Terminal)
```bash
cd frontend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Ejecutar modo desarrollo
npm start

# O crear build de producción
npm run build
npm global install serve
serve -s build -l 3000
```

---

## Opción 3: Deployment en Producción (AWS EC2 / Heroku)

### Para Heroku:
```bash
# Crear dos apps en Heroku (una para backend, otra para frontend)

# Backend (desde carpeta backend)
heroku login
heroku create iteso-lover-backend
heroku config:set MONGODB_URI=tu_mongodb_atlas_uri
heroku config:set JWT_SECRET=tu_jwt_secret_muy_seguro
git push heroku main:main

# Frontend (desde carpeta frontend)
heroku create iteso-lover-frontend
heroku config:set REACT_APP_API_URL=https://iteso-lover-backend.herokuapp.com/api
git push heroku main:main
```

### Para AWS EC2:
```bash
# 1. Conectar a tu instancia EC2
ssh -i tu_clave.pem ubuntu@tu_ip_publica

# 2. Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Instalar MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# 4. Clonar proyecto
git clone tu_repo
cd Iteso-Lover

# 5. Setup Backend
cd backend
npm install
cp .env.example .env
# Editar .env con valores reales

# 6. Setup Frontend
cd ../frontend
npm install
npm run build

# 7. Usar PM2 para mantener servicios activos
sudo npm install -g pm2
pm2 start server.js --name "iteso-backend"
pm2 start "serve -s build -l 3000" --name "iteso-frontend"
pm2 startup
pm2 save
```

---

## Configuración de AWS S3 para Fotos

### 1. Crear bucket S3
```bash
# En AWS Console o CLI
aws s3 mb s3://iteso-lover-bucket --region us-east-1
```

### 2. Configurar permisos públicos
```bash
# Policy JSON para el bucket
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::iteso-lover-bucket/*"
    }
  ]
}
```

### 3. Crear credenciales IAM
- Ir a IAM Console
- Crear usuario con acceso a S3
- Guardar Access Key ID y Secret Access Key
- Agregar a variables de entorno

---

## Monitoreo y Mantenimiento

### Ver logs
```bash
# Con Docker
docker-compose logs -f backend
docker-compose logs -f frontend

# Local con PM2
pm2 logs iteso-backend
pm2 logs iteso-frontend
```

### Actualizar código
```bash
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

### Backup MongoDB
```bash
# Crear backup
mongodump --uri "mongodb://user:pass@host/iteso-lover" --out ./backup

# Restaurar
mongorestore --uri "mongodb://user:pass@host" ./backup
```

---

## Troubleshooting

### Puerto 3000/5000 ya en uso
```bash
# Cambiar puerto en docker-compose.yml o usar:
lsof -i :5000  # Ver qué usa el puerto
kill -9 <PID>
```

### Error de CORS
Verificar que `FRONTEND_URL` en backend sea correcto y matches origin

### Error de conexión MongoDB
```bash
# Verificar conexión
mongo "mongodb://root:password@mongodb:27017/iteso-lover?authSource=admin"
```

### Fotos no suben
- Verificar AWS credentials en .env
- Verificar permisos de bucket S3
- Revisar logs: `docker-compose logs backend`

---

## Comandos Docker Útiles

```bash
# Ver estado de servicios
docker-compose ps

# Parar servicios
docker-compose down

# Reiniciar
docker-compose restart

# limpiar todo
docker-compose down -v

# Ver logs en tiempo real
docker-compose logs -f

# Ejecutar comando en contenedor
docker-compose exec backend npm test
docker-compose exec frontend npm test
```

---

## Variables de Entorno Críticas

```
Backend:
- MONGODB_URI: Conexión a MongoDB
- JWT_SECRET: Clave para firmar tokens (mínimo 32 caracteres)
- NODE_ENV: development/production
- AWS_ACCESS_KEY_ID: Para S3
- AWS_SECRET_ACCESS_KEY: Para S3
- FRONTEND_URL: URL del frontend para CORS

Frontend:
- REACT_APP_API_URL: URL del backend API
- REACT_APP_SOCKET_URL: URL para Socket.io
```
