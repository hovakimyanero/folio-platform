# Folio — Creative Portfolio Platform

## Полноценная платформа для дизайнеров (Behance / Awwwards уровень)

---

## Архитектура

```
folio-platform/
├── frontend/          # React + Vite + Radix UI
│   ├── src/
│   │   ├── components/   # UI компоненты (Radix-based)
│   │   ├── pages/        # Страницы (роуты)
│   │   ├── hooks/        # Кастомные хуки
│   │   ├── utils/        # Утилиты
│   │   ├── context/      # React Context (auth, theme)
│   │   ├── styles/       # Глобальные стили
│   │   └── App.jsx       # Главный компонент + роутинг
│   ├── package.json
│   └── vite.config.js
│
├── backend/           # Node.js + Express + Prisma + PostgreSQL
│   ├── src/
│   │   ├── modules/      # Модули (auth, users, projects, etc.)
│   │   ├── common/       # Middleware, guards, helpers
│   │   └── config/       # Database, env, S3
│   ├── prisma/
│   │   └── schema.prisma # Полная схема БД
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

## Технологии

### Frontend
- **React 18** + **Vite**
- **React Router 6** — клиентский роутинг
- **Radix UI** — Dialog, Dropdown, Tooltip, Tabs, Toast, Avatar, Popover
- **GSAP** — анимации (scroll, parallax, card tilt)
- **CSS Modules** — стили без конфликтов
- **Axios** — HTTP клиент

### Backend
- **Node.js** + **Express**
- **Prisma ORM** — типизированная работа с БД
- **PostgreSQL** — основная БД
- **JWT** — авторизация (access + refresh tokens)
- **bcrypt** — хеширование паролей
- **Multer + S3** — загрузка файлов
- **Socket.io** — real-time (чат, уведомления)
- **Nodemailer** — отправка email

---

## Быстрый старт

### 1. Клонировать проект
```bash
git clone <repo-url>
cd folio-platform
```

### 2. Backend
```bash
cd backend
cp .env.example .env
# Заполни .env (DATABASE_URL, JWT_SECRET, S3 keys, etc.)
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Открыть
```
Frontend: http://localhost:5173
Backend:  http://localhost:4000
```

---

## Деплой

### Frontend → Netlify
```bash
cd frontend
npm run build
# Загрузить dist/ на Netlify
# Добавить _redirects: /*  /index.html  200
```

### Backend → Railway / Render
```bash
# Railway:
railway init
railway up

# Render:
# Подключить Git repo → Node environment
# Build: npm install && npx prisma migrate deploy
# Start: npm start
```

### Database → Supabase / Neon
```
Создать PostgreSQL instance
Скопировать DATABASE_URL в .env
npx prisma migrate deploy
```

### Storage → Cloudflare R2 / AWS S3
```
Создать bucket
Настроить CORS
Добавить ключи в .env
```

---

## Маршруты (Frontend)

| Путь | Страница |
|------|----------|
| `/` | Главная |
| `/projects` | Каталог проектов |
| `/projects/:id` | Страница проекта |
| `/upload` | Загрузка проекта |
| `/profile/:username` | Профиль пользователя |
| `/search` | Поиск |
| `/categories/:slug` | Категория |
| `/collections` | Коллекции |
| `/collections/:id` | Коллекция |
| `/challenges` | Челленджи |
| `/challenges/:id` | Челлендж |
| `/messages` | Сообщения |
| `/notifications` | Уведомления |
| `/settings` | Настройки |
| `/admin` | Админ-панель |

---

## API Endpoints (Backend)

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/google`
- `GET /api/auth/apple`

### Users
- `GET /api/users/:username`
- `PATCH /api/users/me`
- `POST /api/users/:id/follow`
- `DELETE /api/users/:id/follow`

### Projects
- `GET /api/projects` (query: sort, category, page)
- `GET /api/projects/:id`
- `POST /api/projects`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/like`
- `DELETE /api/projects/:id/like`

### Comments
- `GET /api/projects/:id/comments`
- `POST /api/projects/:id/comments`
- `DELETE /api/comments/:id`

### Collections
- `GET /api/collections`
- `POST /api/collections`
- `POST /api/collections/:id/projects`
- `DELETE /api/collections/:id/projects/:projectId`

### Challenges
- `GET /api/challenges`
- `GET /api/challenges/:id`
- `POST /api/challenges/:id/participate`

### Messages
- WebSocket: `connect`, `message`, `typing`

### Notifications
- `GET /api/notifications`
- `PATCH /api/notifications/read`

### Admin
- `GET /api/admin/reports`
- `POST /api/admin/ban/:userId`
- `PATCH /api/admin/projects/:id/feature`
