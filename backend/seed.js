require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/iteso-lover';

const userSchema = new mongoose.Schema({
  firstName: String, lastName: String, email: String, password: String,
  bio: String, gender: String, interests: [String], careerGoal: String, careerName: String,
  birthDate: Date, phoneNumber: String, isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  role: { type: String, default: 'user' },
  preferences: { interestedIn: { type: String, default: 'all' } },
  profilePhoto: String, blockedUsers: [], loginAttempts: { type: Number, default: 0 },
  refreshTokenVersion: { type: Number, default: 0 },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

const INTERESTS = ['Deportes', 'Música', 'Arte', 'Tecnología', 'Viajes', 'Comida',
  'Películas', 'Libros', 'Gaming', 'Moda', 'Ciencia', 'Naturaleza'];

const pick = (arr, n) => arr.sort(() => 0.5 - Math.random()).slice(0, n);

const profiles = [
  {
    firstName: 'Sofía', lastName: 'Ramírez', email: 'sofia.ramirez@iteso.mx',
    bio: 'Estudiante de Diseño Gráfico apasionada por el arte digital y la sostenibilidad. Me encanta tomar fotos y hacer senderismo los fines de semana.',
    gender: 'female', interests: ['Arte', 'Naturaleza', 'Viajes', 'Fotografía'],
    careerName: 'Diseño Gráfico',
    careerGoal: 'Crear una agencia de diseño enfocada en marcas sustentables',
    birthDate: new Date('2002-03-15'),
    preferences: { interestedIn: 'male' },
    isVerified: true,
    profilePhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    firstName: 'Carlos', lastName: 'Mendoza', email: 'carlos.mendoza@iteso.mx',
    bio: 'Ingeniero en Sistemas. Amo el café, los videojuegos y aprender tecnologías nuevas. Busco a alguien con quien compartir aventuras y conversaciones profundas.',
    gender: 'male', interests: ['Gaming', 'Tecnología', 'Música', 'Ciencia'],
    careerName: 'Ingeniería en Sistemas',
    careerGoal: 'Fundar una startup de inteligencia artificial en México',
    birthDate: new Date('2001-07-22'),
    preferences: { interestedIn: 'female' },
    isVerified: true,
    profilePhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    firstName: 'Valentina', lastName: 'Torres', email: 'valentina.torres@iteso.mx',
    bio: 'Psicología, tercer semestre. Me gusta leer, el yoga y los documentales de crimen. Muy fan de los conciertos en vivo.',
    gender: 'female', interests: ['Libros', 'Música', 'Arte', 'Yoga'],
    careerName: 'Psicología',
    careerGoal: 'Especializarme en psicología clínica y abrir mi propio consultorio',
    birthDate: new Date('2003-11-08'),
    preferences: { interestedIn: 'male' },
    profilePhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    firstName: 'Diego', lastName: 'Herrera', email: 'diego.herrera@iteso.mx',
    bio: 'Administración de empresas. Emprendedor por naturaleza, ya tengo mi primer negocio de comida saludable. En mis ratos libres juego fútbol y hago CrossFit.',
    gender: 'male', interests: ['Deportes', 'Comida', 'Emprendimiento', 'Fitness'],
    careerName: 'Administración de Empresas',
    careerGoal: 'Crecer mi empresa y expandirla a toda la república',
    birthDate: new Date('2001-05-30'),
    preferences: { interestedIn: 'female' },
    profilePhoto: 'https://randomuser.me/api/portraits/men/55.jpg',
  },
  {
    firstName: 'Mariana', lastName: 'López', email: 'mariana.lopez@iteso.mx',
    bio: 'Arquitectura. Obsesionada con el diseño urbano y los espacios que transforman comunidades. Coleccionista de libros y aficionada al jazz.',
    gender: 'female', interests: ['Arte', 'Libros', 'Música', 'Naturaleza'],
    careerName: 'Arquitectura',
    careerGoal: 'Diseñar vivienda social accesible en Latinoamérica',
    birthDate: new Date('2000-09-12'),
    preferences: { interestedIn: 'all' },
    isVerified: true,
    profilePhoto: 'https://randomuser.me/api/portraits/women/12.jpg',
  },
  {
    firstName: 'Andrés', lastName: 'García', email: 'andres.garcia@iteso.mx',
    bio: 'Relaciones Internacionales. He vivido en 3 países y hablo 4 idiomas. Apasionado por la geopolítica, la cocina italiana y el tenis.',
    gender: 'male', interests: ['Viajes', 'Cocina', 'Deportes', 'Idiomas'],
    careerName: 'Relaciones Internacionales',
    careerGoal: 'Trabajar en organismos internacionales como la ONU',
    birthDate: new Date('2001-02-14'),
    preferences: { interestedIn: 'female' },
    profilePhoto: 'https://randomuser.me/api/portraits/men/76.jpg',
  },
  {
    firstName: 'Isabella', lastName: 'Moreno', email: 'isabella.moreno@iteso.mx',
    bio: 'Comunicación. Creadora de contenido y podcaster. Me encantan los festivales de música, el cine independiente y cocinar recetas nuevas cada semana.',
    gender: 'female', interests: ['Música', 'Películas', 'Cocina', 'Teatro'],
    careerName: 'Comunicación',
    careerGoal: 'Tener un medio de comunicación propio enfocado en cultura',
    birthDate: new Date('2002-06-25'),
    preferences: { interestedIn: 'male' },
    profilePhoto: 'https://randomuser.me/api/portraits/women/90.jpg',
  },
  {
    firstName: 'Sebastián', lastName: 'Castillo', email: 'sebastian.castillo@iteso.mx',
    bio: 'Medicina. Sí, duermo poco y leo mucho. Me apasionan los deportes de aventura, escalar y los viajes a lugares sin señal. Busco complicidad real.',
    gender: 'male', interests: ['Deportes', 'Naturaleza', 'Ciencia', 'Fitness'],
    careerName: 'Medicina',
    careerGoal: 'Especializarme en medicina de emergencias y trabajar en zonas de desastre',
    birthDate: new Date('2000-01-18'),
    preferences: { interestedIn: 'female' },
    isVerified: true,
    profilePhoto: 'https://randomuser.me/api/portraits/men/14.jpg',
  },
  {
    firstName: 'Camila', lastName: 'Vega', email: 'camila.vega@iteso.mx',
    bio: 'Ingeniería Ambiental. Activista y vegana. En mis tiempos libres hago cerámica, yoga y siembro en mi jardín urbano. Busco personas con conciencia.',
    gender: 'female', interests: ['Naturaleza', 'Ciencia', 'Yoga', 'Voluntariado'],
    careerName: 'Ingeniería Ambiental',
    careerGoal: 'Desarrollar proyectos de energía renovable en comunidades rurales',
    birthDate: new Date('2003-04-02'),
    preferences: { interestedIn: 'all' },
    profilePhoto: 'https://randomuser.me/api/portraits/women/33.jpg',
  },
  {
    firstName: 'Miguel', lastName: 'Ríos', email: 'miguel.rios@iteso.mx',
    bio: 'Derecho, último semestre. Guitarrista aficionado y cinéfilo empedernido. Me gusta la filosofía, debatir ideas y los tacos de canasta.',
    gender: 'male', interests: ['Música', 'Películas', 'Libros', 'Política'],
    careerName: 'Derecho',
    careerGoal: 'Ejercer el derecho ambiental y de derechos humanos',
    birthDate: new Date('2000-10-30'),
    preferences: { interestedIn: 'female' },
    profilePhoto: 'https://randomuser.me/api/portraits/men/62.jpg',
  },
  // Admin de prueba
  {
    firstName: 'Admin', lastName: 'ITESO', email: 'admin@iteso.mx',
    bio: 'Cuenta de administración del sistema.',
    gender: 'other', interests: [],
    careerName: '', careerGoal: '',
    preferences: { interestedIn: 'all' },
    role: 'admin',
    isVerified: true,
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Conectado a MongoDB');

  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log(`Ya hay ${existing} usuarios. Si quieres resetear, corre: npm run seed:reset`);
    await mongoose.disconnect();
    return;
  }

  const salt = await bcryptjs.genSalt(10);
  const hash = await bcryptjs.hash('Test1234', salt);

  const docs = profiles.map((p) => ({ ...p, password: hash }));
  await User.insertMany(docs);

  console.log(`✓ ${docs.length} perfiles creados. Contraseña para todos: Test1234`);
  console.log('  Admin: admin@iteso.mx / Test1234');
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
