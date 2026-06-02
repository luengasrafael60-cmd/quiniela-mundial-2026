# 🏆 Quiniela Mundial 2026

Aplicación web completa para quiniela del Mundial con React + Node.js + MongoDB.

---

## 📁 Estructura del proyecto

```
quiniela-mundial/
├── backend/
│   ├── src/
│   │   ├── index.js              ← Entrada principal del servidor
│   │   ├── middleware/
│   │   │   └── auth.js           ← JWT middleware
│   │   ├── models/
│   │   │   ├── User.js           ← Modelo de usuario
│   │   │   ├── Match.js          ← Modelo de partido
│   │   │   ├── Prediction.js     ← Pronósticos de partidos
│   │   │   └── GroupPrediction.js ← Pronósticos de grupos y especiales
│   │   ├── routes/
│   │   │   ├── auth.js           ← Login / Register
│   │   │   ├── groups.js         ← Grupos y equipos
│   │   │   ├── matches.js        ← Partidos
│   │   │   ├── predictions.js    ← Guardar pronósticos
│   │   │   ├── leaderboard.js    ← Tabla de posiciones
│   │   │   ├── admin.js          ← Panel admin (resultados, bracket)
│   │   │   └── users.js          ← Perfil de usuario
│   │   └── utils/
│   │       ├── points.js         ← Lógica de puntos
│   │       └── seed.js           ← Script inicial de datos
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       └── AppLayout.jsx ← Sidebar + navegación
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── GroupsPage.jsx    ← Seleccionar clasificados
    │   │   ├── MatchesPage.jsx   ← Predecir marcadores
    │   │   ├── BracketPage.jsx   ← Fase eliminatoria
    │   │   ├── SpecialPage.jsx   ← Campeón, subcampeón, etc.
    │   │   ├── LeaderboardPage.jsx
    │   │   └── AdminPage.jsx     ← Panel administrador
    │   ├── store/
    │   │   └── authStore.js      ← Estado de autenticación (Zustand)
    │   ├── utils/
    │   │   └── api.js            ← Instancia de Axios
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css             ← Design system oscuro deportivo
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🗄️ Modelos de base de datos

### User
| Campo | Tipo | Descripción |
|-------|------|-------------|
| name | String | Nombre del jugador |
| email | String | Email único |
| password | String | Hash bcrypt |
| role | String | 'user' / 'admin' |
| totalPoints | Number | Puntos totales |
| totalCorrect | Number | Total de aciertos |
| rank | Number | Posición en tabla |

### Match
| Campo | Tipo | Descripción |
|-------|------|-------------|
| matchNumber | Number | Número único de partido |
| phase | String | groups / round16 / quarterfinals / semifinals / final |
| group | String | Letra del grupo (A-L) |
| homeTeam / awayTeam | Object | {name, flag, code} |
| homeScore / awayScore | Number | Marcador real |
| winner | String | 'home' / 'away' / 'draw' |
| status | String | scheduled / live / finished |

### Prediction
| Campo | Tipo | Descripción |
|-------|------|-------------|
| user | ObjectId | Referencia al usuario |
| match | ObjectId | Referencia al partido |
| predictedHomeScore | Number | Marcador predicho local |
| predictedAwayScore | Number | Marcador predicho visitante |
| predictedWinner | String | 'home' / 'away' (eliminatoria) |
| pointsEarned | Number | Puntos ganados |
| isLocked | Boolean | Se bloquea cuando inicia |

### GroupPrediction
| Campo | Tipo | Descripción |
|-------|------|-------------|
| user | ObjectId | Usuario |
| group | String | Letra del grupo |
| team1 / team2 | String | Equipos que clasifica |

### SpecialPrediction
| Campo | Tipo | Descripción |
|-------|------|-------------|
| user | ObjectId | Usuario |
| champion | String | Campeón predicho |
| runnerUp | String | Subcampeón |
| thirdPlace | String | Tercer lugar |

---

## 🎯 Sistema de puntos

| Acierto | Puntos |
|---------|--------|
| Clasificado de grupo correcto | +3 pts |
| Ganador/empate correcto en grupos | +2 pts |
| Marcador exacto en grupos | +5 pts |
| Ganador correcto en octavos | +4 pts |
| Ganador correcto en cuartos | +6 pts |
| Ganador correcto en semifinales | +8 pts |
| Ganador correcto en final | +10 pts |
| Campeón correcto | +20 pts |
| Subcampeón correcto | +10 pts |
| Tercer lugar correcto | +7 pts |
| Cuarto lugar correcto | +5 pts |

---

## 🚀 Cómo iniciar desde cero

### Requisitos
- Node.js 18+
- MongoDB (local o MongoDB Atlas)
- Git

### 1. Clonar / descargar el proyecto
```bash
# Si lo clonas desde repositorio:
git clone <url> quiniela-mundial
cd quiniela-mundial

# O si ya tienes la carpeta:
cd quiniela-mundial
```

### 2. Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo de configuración
cp .env.example .env
```

Editar el `.env`:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/quiniela_mundial
JWT_SECRET=cambia_esto_por_algo_muy_secreto_123
JWT_EXPIRES_IN=7d
```

> **MongoDB Atlas (nube):** Cambia MONGODB_URI por tu string de conexión:
> `mongodb+srv://usuario:password@cluster.mongodb.net/quiniela_mundial`

```bash
# Cargar datos iniciales (admin + partidos de grupos)
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

El backend corre en http://localhost:4000

### 3. Configurar el Frontend

```bash
# En otra terminal:
cd frontend
npm install
npm run dev
```

El frontend corre en http://localhost:5173

### 4. Primer acceso

1. Abre http://localhost:5173
2. El seed crea un admin: **admin@quiniela.com** / **admin123**
3. Regístrate como jugador normal con tu email
4. El admin puede entrar al **Panel Admin** desde el sidebar

---

## 🔄 Flujo del torneo

```
1. Fase de Grupos
   └── Admin actualiza resultados (1-0, 2-2, etc.)
   └── Sistema recalcula clasificados y puntos automáticamente

2. Octavos de Final
   └── Admin hace click en "Generar bracket de octavos"
   └── Se crean los 8 partidos con los clasificados reales

3. Cuartos → Semis → Final
   └── Admin actualiza resultados de cada partido
   └── Puntos se acumulan automáticamente

4. Final del torneo
   └── Puntos especiales (campeón, etc.) se calculan
   └── Tabla final queda como ranking oficial
```

---

## ⚙️ Panel Admin

Accesible en `/admin` solo para usuarios con `role: 'admin'`.

Funciones:
- **Ver estadísticas** generales del torneo
- **Actualizar resultados** de partidos (marcador + estado)
- **Cambiar estado**: Programado → En vivo → Finalizado
- **Generar bracket** de octavos automáticamente
- **Recalcular puntos** de todos los jugadores manualmente

Al poner un partido en **"En vivo"**, todos los pronósticos se bloquean automáticamente.
Al marcarlo como **"Finalizado"**, los puntos se calculan y distribuyen.

---

## 🌐 Deploy en producción

### Backend (Railway / Render / Fly.io)
```bash
# Variables de entorno en producción:
NODE_ENV=production
MONGODB_URI=mongodb+srv://...  # Atlas
JWT_SECRET=secreto_muy_largo_y_aleatorio
FRONTEND_URL=https://tu-frontend.vercel.app
```

### Frontend (Vercel / Netlify)
```bash
cd frontend
npm run build
# Subir la carpeta dist/
```

En `vite.config.js`, cambia el proxy por la URL real del backend en producción o usa una variable de entorno:
```js
// frontend/src/utils/api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});
```

Y agrega en Vercel/Netlify:
```
VITE_API_URL=https://tu-backend.railway.app/api
```

---

## 📝 Notas adicionales

- Los grupos del Mundial 2026 están cargados en `backend/src/routes/groups.js`. Ajústalos cuando se confirmen los grupos oficiales.
- El sistema soporta 48 equipos en 12 grupos de 4 (formato FIFA 2026).
- Los pronósticos se bloquean automáticamente cuando el admin marca un partido como "live".
- La tabla de posiciones se actualiza en tiempo real cada vez que se guarda un resultado.
