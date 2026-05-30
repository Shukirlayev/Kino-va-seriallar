import { Telegraf, Markup } from "telegraf";
import prisma from "./db";

let bot: Telegraf | null = null;

export function setupBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("⚠️ TELEGRAM_BOT_TOKEN is missing. Bot will not start. (This is normal in preview until configured)");
    return;
  }

  bot = new Telegraf(token);

  // Default Language is Uzbek
  bot.start(async (ctx) => {
    try {
      if (process.env.DATABASE_URL) {
        // Auto register user
         await prisma.user.upsert({
           where: { telegramId: ctx.from.id },
           update: { username: ctx.from.username, firstName: ctx.from.first_name },
           create: { 
             telegramId: ctx.from.id, 
             username: ctx.from.username, 
             firstName: ctx.from.first_name 
           }
         });
      }
    } catch (e) {
      console.error("DB error on start:", e);
    }

    const appUrl = process.env.APP_URL || "https://google.com";

    ctx.reply(
      "👋 Kino va Seriallar platformamizga xush kelibsiz! \n\n👇 Barcha filmlarni ko'rish uchun pastdagi tugmani bosing:",
      Markup.inlineKeyboard([
        Markup.button.webApp("🎬 Ilovani ochish", appUrl)
      ])
    );
  });

  bot.command("admin", (ctx) => {
    const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(",") || [];
    if (!adminIds.includes(ctx.from.id.toString())) {
       return ctx.reply("Sizda admin huquqlari yo'q."); // "You dont have admin rights"
    }

    ctx.reply("👨‍💻 Admin Panel", Markup.inlineKeyboard([
      [Markup.button.callback("➕ Film qo'shish", "add_movie")],
      [Markup.button.callback("➕ Serial qo'shish", "add_series")],
      [Markup.button.callback("📊 Statistika", "admin_stats")]
    ]));
  });

  // Basic callback handler example (complex flows require Telegraf Scenes)
  bot.action("add_movie", (ctx) => {
    ctx.answerCbQuery();
    ctx.reply("Film qo'shish uchun kino faylini yuboring, tavsif va nomni izoh (caption) qilib yozing.");
  });

  bot.action("admin_stats", async (ctx) => {
    ctx.answerCbQuery();
    if (!process.env.DATABASE_URL) return ctx.reply("Bazada xatolik.");
    try {
      const usersCount = await prisma.user.count();
      const moviesCount = await prisma.movie.count();
      ctx.reply(`📊 Statistika:\n\nFoydalanuvchilar: ${usersCount}\nFilmlar: ${moviesCount}`);
    } catch (e) {
      ctx.reply("Ma'lumot olishda xatolik yuz berdi.");
    }
  });
  
  // Handle video uploads from admin
  bot.on('video', async (ctx) => {
     const adminIds = process.env.ADMIN_TELEGRAM_IDS?.split(",") || [];
     if (!adminIds.includes(ctx.from.id.toString())) return;

     const fileId = ctx.message.video.file_id;
     ctx.reply(`✅ Video qabul qilindi! \n\nFile_ID: \`${fileId}\`\n\n(Dasturni rivojlantirish bosqichida ushbu ID ni bazaga kiritishingiz mumkin)`, { parse_mode: 'Markdown' });
  });

  bot.launch().then(() => {
    console.log("🦾 Telegram Bot started completely!");
  });

  // Enable graceful stop
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
}

export { bot };
