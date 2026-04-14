# 📚 Guía de Desarrollo - ITESO-Lover

## 🎯 Convenciones de Código

### Backend (Node.js + Express)

#### Estructura de Controladores
```javascript
// async/await preferido
exports.functionName = async (req, res, next) => {
  try {
    // Validación
    if (!req.body.required) {
      return res.status(400).json({
        success: false,
        message: 'Error message'
      });
    }

    // Lógica
    const result = await Model.findById(id);

    // Respuesta
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

#### Estándar de Respuestas
```javascript
// Éxito
{
  "success": true,
  "message": "Acción completada",
  "data": { /* datos */ }
}

// Error
{
  "success": false,
  "message": "Descripción del error",
  "error": { /* detalles */ }
}
```

### Frontend (React)

#### Estructura de Componentes
```javascript
import React, { useState, useEffect } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects
  }, [dependencies]);

  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

#### Uso de Zustand Store
```javascript
import useStore from '../store/store';

const Component = () => {
  const data = useStore((state) => state.data);
  const setData = useStore((state) => state.setData);

  return (
    <div onClick={() => setData(newValue)}>
      {data}
    </div>
  );
};
```

## 🔄 Flujo de Desarrollo

### Agregar Nueva Feature

1. **Backend - Crear modelo** (si es necesario)
   ```bash
   cd backend/src/models
   # Crear ModelName.js
   ```

2. **Backend - Controlador**
   ```bash
   cd ../controllers
   # Crear o editar controller.js
   ```

3. **Backend - Ruta**
   ```bash
   cd ../routes
   # Agregar endpoint en routes file
   ```

4. **Frontend - Servicio API**
   ```bash
   cd frontend/src/services
   # Agregar función en services.js
   ```

5. **Frontend - Componente**
   ```bash
   cd ../components o pages
   # Crear componente React
   ```

6. **Testing**
   - Prueba con Postman/Insomnia (backend)
   - Prueba en navegador (frontend)

## 📝 Variables de Entorno

### Backend (.env)
```
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=your_secret_key
JWT_REFRESH_SECRET=your_refresh_secret
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET_NAME=your_bucket
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## 🛡️ Validación y Seguridad

### Validación Backend
```javascript
// En controladores
if (!email || !password) {
  return res.status(400).json({ message: 'Required fields' });
}

if (!validateEmail(email)) {
  return res.status(400).json({ message: 'Invalid email' });
}

if (!validatePassword(password)) {
  return res.status(400).json({ message: 'Password too weak' });
}
```

### Protección de Rutas
```javascript
// En routes
router.get('/protected-route', protect, controllerFunction);
```

## 🧪 Testing Recomendado

### Backend (con Jest/Supertest)
```javascript
test('Debería crear usuario', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@iteso.mx',
      password: 'Test123456'
    });

  expect(res.status).toBe(201);
  expect(res.body.success).toBe(true);
});
```

### Frontend (con React Testing Library)
```javascript
test('Debería mostrar formulario de login', () => {
  render(<Login />);
  expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument();
});
```

## 📦 Dependencias Principales

### Backend
- **express** - Framework web
- **mongoose** - ODM para MongoDB
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **axios** - HTTP client
- **helmet** - Security headers
- **cors** - Cross-origin

### Frontend
- **react** - UI library
- **react-router-dom** - Routing
- **axios** - HTTP client
- **zustand** - State management
- **tailwindcss** - CSS framework

## 🐛 Debugging

### Backend
```bash
# Con debug mode
DEBUG=* npm run dev

# Con nodemon
npm run dev
```

### Frontend
- Usar React Developer Tools
- Usar Redux DevTools (para Zustand)
- Usar Network tab del navegador

## 📈 Performance

### Optimizaciones
- Lazy loading de componentes
- Memoización con React.memo
- Índices en MongoDB
- Rate limiting
- Compresión de archivos

## ✅ Checklist Pre-Deploy

- [ ] Variables de entorno configuradas
- [ ] Tests pasando
- [ ] No hay console.log() de debug
- [ ] CORS correctamente configurado
- [ ] Validación de entrada en todas las rutas
- [ ] Errores manejados apropiadamente
- [ ] SSL/HTTPS configurado
- [ ] Backup de base de datos

## 🚀 Deployment

### Opciones Recomendadas
- **Backend**: Heroku, Railway, Render
- **Frontend**: Vercel, Netlify
- **Database**: MongoDB Atlas
- **Storage**: AWS S3, Cloudinary

## 📚 Recursos Útiles

- [Express Docs](https://expressjs.com)
- [MongoDB Docs](https://docs.mongodb.com)
- [React Docs](https://react.dev)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind Docs](https://tailwindcss.com)

