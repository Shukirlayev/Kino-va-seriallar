# Telegram Movie Platform

Bu loyiha **Telegram Bot** va **Mini App (TWA)** o'z ichiga olgan, barcha filmlar va seriallarni Telegram ichida kuzatib boradigan va to'g'ridan-to'g'ri Telegram chatga yuboradigan to'liq (Full-Stack) platformadir.

## Architektura (Architecture)

### 1. Structure
- `src/` - React frontend (Vite & Tailwind CSS)
  - `pages/` - Sahifalar.
  - `components/` - Tarkibiy qismlar.
- `server/` - Backend Express API & Telegram Bot logika.
  - `api.ts` - API routerlari.
  - `bot.ts` - Telegraf botini sozlash va mantiq.
  - `db.ts` - Prisma bazasini ulash.
- `prisma/` - Ma'lumotlar bazasi sxemalari.

### 2. Data Flow
1. Foydalanuvchi Telegram Bot orqali `/start` buyrug'ini yuboradi.
2. Bot Mini Ilovani (Mini App) ochish imkoniyatini taqdim etadi.
3. Foydalanuvchi Mini App orqali (React UI) filmlarni tanlaydi.
4. "Telegramda ko'rish" bosilganda Frontend Express APIdan so'rov yuboradi.
5. Express API orqa fonda bot orqali foydalanuvchiga videoni yuboradi.

### 3. Ma'lumotlar Bazasi (Database)
Prisma ORM yordamida **PostgreSQL** ma'lumotlar bazasi tuzilgan. 
(To'liq sxemani `prisma/schema.prisma` da ko'rishingiz mumkin).

### 4. Xavfsizlik strategiyasi (Security Strategy)
- Telegram `initData` orqali frontend autentifikatsiyasini tekshirish (Bot Token orqali HMAC shifrlash).
- Helmet & CORS middleware himoyalari.
- Zod orqali so'rov (request) ma'lumotlarini tekshirish (Validation).

---

## O'rnatish va Ishga tushirish (Deployment & Setup)

Dasturni To'liq Production Rejimida ishga tushirish uchun quyidagi bosqichlarni bajaring:

### 1. Environment (Muhit O'zgaruvchilari)
`.env.example` ni nusxalab `.env` nomli fayl yarating:
```bash
cp .env.example .env
```
Va ichida kerakli o'zgaruvchilarni to'ldiring:
- `DATABASE_URL` (PostgresDB link).
- `TELEGRAM_BOT_TOKEN` (BotFather dan olingan).
- `ADMIN_TELEGRAM_IDS` (Adminlaringizning ID lari vergul orqali).

### 2. Database Migration (Ma'lumotlar Bazasi)
Prisma yordamida bazani sinxronlash:
```bash
npx prisma db push
npx prisma generate
```

### 3. Development Mod (Rivojlanish bosqichi)
```bash
npm run dev
```

### 4. Production Deployment & Build
Dasturni server yoki Dockerga chiqarish:
```bash
npm run build
npm run start
```

### 5. Dockerfile (Majburiy emas, qoshimcha)
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start"]
```
