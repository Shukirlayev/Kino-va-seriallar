import { Telegraf, Markup } from "telegraf";
import prisma from "./db";

let bot: Telegraf | null = null;
const adminStates = new Map<number, any>();

const clearState = (id: number) => adminStates.delete(id);

export function setupBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("TELEGRAM_BOT_TOKEN topilmadi.");
    return;
  }

  bot = new Telegraf(token);

  const isAdmin = (ctx: any) => {
    if (!ctx.from) return false;
    const ids = (process.env.ADMIN_TELEGRAM_IDS || "").split(",");
    return ids.includes(ctx.from.id.toString());
  };

  bot.start(async (ctx) => {
    clearState(ctx.from.id);
    try {
      if (process.env.DATABASE_URL) {
         await prisma.user.upsert({
           where: { telegramId: ctx.from.id },
           update: { username: ctx.from.username, firstName: ctx.from.first_name },
           create: { 
             telegramId: ctx.from.id, 
             username: ctx.from.username || "", 
             firstName: ctx.from.first_name || ""
           }
         });
      }
    } catch (e) {
      console.error("Foydalanuvchini saqlashda xato:", e);
    }

    const appUrl = process.env.APP_URL || "https://google.com";
    ctx.reply(
      "👋 Kino va Seriallar platformamizga xush kelibsiz! \n\n👇 Barcha filmlarni ko'rish uchun pastdagi tugmani bosing:",
      Markup.inlineKeyboard([[Markup.button.webApp("🎬 Ilovani ochish", appUrl)]])
    );
  });

  // Admin Asosiy Menyu
  bot.command("admin", (ctx) => {
    clearState(ctx.from.id);
    if (!isAdmin(ctx)) return ctx.reply("Sizda admin huquqlari yo'q.");

    ctx.reply("👨‍💻 Admin Panel\n\nQuyidagi amallardan birini tanlang:", Markup.inlineKeyboard([
      [Markup.button.callback("🎬 Film qo'shish", "add_movie"), Markup.button.callback("📺 Serial qo'shish", "add_series")],
      [Markup.button.callback("📼 Qism qo'shish (Serial uchun)", "add_episode")],
      [Markup.button.callback("❌ Amalni bekor qilish", "cancel_admin")],
      [Markup.button.callback("📊 Statistika ko'rish", "admin_stats")]
    ]));
  });

  bot.action("cancel_admin", (ctx) => {
    clearState(ctx.from?.id || 0);
    ctx.reply("Harakat bekor qilindi. /admin orqali panelni qayta ochishingiz mumkin.");
  });

  bot.action("add_movie", (ctx) => {
    if (!isAdmin(ctx)) return;
    adminStates.set(ctx.from.id, { flow: "add_movie", step: 1, data: {} });
    ctx.reply("🎬 Yangi film qo'shamiz.\n\n1. Film nomini yozing (Masalan: Qasoskorlar):");
  });

  bot.action("add_series", (ctx) => {
    if (!isAdmin(ctx)) return;
    adminStates.set(ctx.from.id, { flow: "add_series", step: 1, data: {} });
    ctx.reply("📺 Yangi serial qo'shamiz.\n\n1. Serial nomini yozing (Masalan: Qora ritsarlar):");
  });

  bot.action("add_episode", async (ctx) => {
    if (!isAdmin(ctx)) return;
    try {
        const seriesList = await prisma.series.findMany({ select: { id: true, title: true }});
        if (!seriesList.length) return ctx.reply("Hozircha bazada hech qanday serial yo'q. Oldin serial qo'shing.");
        
        // Ro'yxatni ko'rsatish
        let text = "📼 Qism qo'shish uchun quyidagi seriallardan birining ID raqamini pastga yozing:\n\n";
        seriesList.forEach(s => {
          text += `ID: ${s.id} | ${s.title}\n`;
        });
        
        adminStates.set(ctx.from.id, { flow: "add_episode", step: 1, data: {} });
        ctx.reply(text);
    } catch(e) {
        ctx.reply("Baza bilan xatolik yuz berdi.");
    }
  });

  bot.action("admin_stats", async (ctx) => {
    if (!isAdmin(ctx)) return;
    try {
      const u = await prisma.user.count();
      const m = await prisma.movie.count();
      const s = await prisma.series.count();
      const e = await prisma.episode.count();
      ctx.reply(`📊 Platforma Statistikasi:\n\n👥 Foydalanuvchilar: ${u} ta\n🎬 Filmlar: ${m} ta\n📺 Seriallar: ${s} ta\n📼 Jami qismlar: ${e} ta`);
    } catch(e) {
      ctx.reply("Xatolik yuz berdi.");
    }
  });

  // Matnli javoblarni ushlab olish (State orqali)
  bot.on("text", async (ctx, next) => {
    const state = adminStates.get(ctx.from.id);
    if (!state || !isAdmin(ctx)) return next();
    const text = ctx.message.text;

    try {
        // --- ADD MOVIE ---
        if (state.flow === "add_movie") {
            if (state.step === 1) {
                state.data.title = text;
                state.step = 2;
                return ctx.reply("2. Film tavsifini (Opisaniye) yozing:");
            }
            if (state.step === 2) {
                state.data.description = text;
                state.step = 3;
                return ctx.reply("3. Film posteri xavolasi (Rasmning URL manzilini) yuboring. \nMasalan: https://site.com/rasm.jpg");
            }
            if (state.step === 3) {
                state.data.poster = text;
                state.step = 4;
                return ctx.reply("4. Film tilini yozing (Masalan: O'zbek):");
            }
            if (state.step === 4) {
                state.data.language = text;
                state.step = 5;
                return ctx.reply("5. Va nihoyat, filmning Video faylini shu chatga yuklang (Maks. 2GB):");
            }
        }
        
        // --- ADD SERIES ---
        if (state.flow === "add_series") {
            if (state.step === 1) {
                state.data.title = text;
                state.step = 2;
                return ctx.reply("2. Serial tavsifini yozing:");
            }
            if (state.step === 2) {
                state.data.description = text;
                state.step = 3;
                return ctx.reply("3. Serial posteri xavolasini (Rasm URL manzilini) yuboring:");
            }
            if (state.step === 3) {
                state.data.poster = text;
                
                // Saqlash
                await prisma.series.create({
                    data: {
                        title: state.data.title,
                        description: state.data.description,
                        poster: state.data.poster
                    }
                });
                clearState(ctx.from.id);
                return ctx.reply("✅ Serial muvaffaqiyatli saqlandi! Endi \"Qism qo'shish\" orqali epizodlarni qo'shishingiz mumkin.");
            }
        }

        // --- ADD EPISODE ---
        if (state.flow === "add_episode") {
            if (state.step === 1) {
                const seriesId = parseInt(text);
                if (isNaN(seriesId)) return ctx.reply("Iltimos, faqat ID raqam kiriting:");
                state.data.seriesId = seriesId;
                state.step = 2;
                return ctx.reply("2. Nechanchi fasl ekanligini yozing (Masalan: 1):");
            }
            if (state.step === 2) {
                const seasonNum = parseInt(text);
                if (isNaN(seasonNum)) return ctx.reply("Faqat raqam kiriting:");
                state.data.seasonNum = seasonNum;
                state.step = 3;
                return ctx.reply("3. Nechanchi qism ekanligini yozing (Masalan: 5):");
            }
            if (state.step === 3) {
                const epNum = parseInt(text);
                if (isNaN(epNum)) return ctx.reply("Faqat raqam kiriting:");
                state.data.episodeNum = epNum;
                state.step = 4;
                return ctx.reply("4. Qism tilini kiriting (Masalan: O'zbek):");
            }
            if (state.step === 4) {
                state.data.language = text;
                state.step = 5;
                return ctx.reply("5. Qismning video faylini shu yerga yuboring:");
            }
        }
    } catch(e) {
        console.error(e);
        ctx.reply("❌ Xatolik yuz berdi. Iltimos bekor qilib boshqatdan urinib ko'ring.");
        clearState(ctx.from.id);
    }
  });

  // Video faylni ushlash
  bot.on("video", async (ctx, next) => {
      const state = adminStates.get(ctx.from.id);
      if (!state || !isAdmin(ctx)) return next();
      
      try {
          const fileId = ctx.message.video.file_id;

          if (state.flow === "add_movie" && state.step === 5) {
             ctx.reply("⏳ Yuklanmoqda... Bazaga saqlanmoqda...");
             await prisma.movie.create({
                 data: {
                     title: state.data.title,
                     description: state.data.description,
                     poster: state.data.poster,
                     languages: {
                         create: [
                             { language: state.data.language, fileId: fileId }
                         ]
                     }
                 }
             });
             clearState(ctx.from.id);
             return ctx.reply("✅ Film muvaffaqiyatli saqlandi! /admin ni bosib davom ettirishingiz mumkin.");
          }

          if (state.flow === "add_episode" && state.step === 5) {
             ctx.reply("⏳ Yuklanmoqda... Qism saqlanmoqda...");
             
             // Faslni tekshirish
             let season = await prisma.season.findFirst({
                 where: { seriesId: state.data.seriesId, seasonNum: state.data.seasonNum }
             });
             if (!season) {
                 season = await prisma.season.create({
                     data: { seriesId: state.data.seriesId, seasonNum: state.data.seasonNum }
                 });
             }
             
             // Qismni tekshirish
             let episode = await prisma.episode.findFirst({
                 where: { seasonId: season.id, episodeNum: state.data.episodeNum }
             });
             if (!episode) {
                 episode = await prisma.episode.create({
                     data: { seasonId: season.id, episodeNum: state.data.episodeNum }
                 });
             }

             // Tilni va faylni qo'shish
             await prisma.episodeLanguage.create({
                 data: {
                     episodeId: episode.id,
                     language: state.data.language,
                     fileId: fileId
                 }
             });

             clearState(ctx.from.id);
             return ctx.reply("✅ Qism muvaffaqiyatli saqlandi! /admin ni bosib davom eting.");
          }
      } catch(e) {
          console.error(e);
          ctx.reply("❌ Xatolik yuz berdi saqlash davomida.");
          clearState(ctx.from.id);
      }
  });

  bot.launch().then(() => console.log("🤖 Telegram Bot To'liq Ishga Tushdi."));
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
}

export { bot };
