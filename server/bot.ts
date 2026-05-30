import { Telegraf, Markup } from "telegraf";
import prisma from "./db";

let bot: Telegraf | null = null;
const adminStates = new Map<number, any>();

const clearState = (id: number) => adminStates.delete(id);
const cancelBtn = Markup.inlineKeyboard([Markup.button.callback("❌ Bekor qilish", "cancel_admin")]);

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

  bot.command("admin", (ctx) => {
    clearState(ctx.from.id);
    if (!isAdmin(ctx)) return ctx.reply("⛔️ Sizda admin huquqlari yo'q.");

    ctx.reply("👨‍💻 Admin Panel\n\n👇 Platformani boshqarish uchun quyidagi menyulardan foydalaning:", Markup.inlineKeyboard([
      [Markup.button.callback("🎬 Film qo'shish", "add_movie"), Markup.button.callback("📺 Serial qo'shish", "add_series")],
      [Markup.button.callback("📼 Qism qo'shish (Serial uchun)", "add_episode")],
      [Markup.button.callback("🗑 Filmlarni uchirish", "del_movies"), Markup.button.callback("🗑 Serialni uchirish", "del_series")],
      [Markup.button.callback("📊 Platforma Statistikasi", "admin_stats")]
    ]));
  });

  bot.action("cancel_admin", (ctx) => {
    clearState(ctx.from?.id || 0);
    ctx.editMessageText("❌ Amal bekor qilindi. Bosh menyu uchun /admin ni bosing.", Markup.inlineKeyboard([]));
    ctx.answerCbQuery();
  });

  bot.action("add_movie", (ctx) => {
    if (!isAdmin(ctx)) return;
    adminStates.set(ctx.from.id, { flow: "add_movie", step: 1, data: {} });
    ctx.editMessageText("🎬 Yangi film qo'shamiz.\n\n1️⃣ Film nomini yozing (Masalan: Qasoskorlar):", cancelBtn);
  });

  bot.action("add_series", (ctx) => {
    if (!isAdmin(ctx)) return;
    adminStates.set(ctx.from.id, { flow: "add_series", step: 1, data: {} });
    ctx.editMessageText("📺 Yangi serial qo'shamiz.\n\n1️⃣ Serial nomini yozing (Masalan: Qora ritsarlar):", cancelBtn);
  });

  bot.action("add_episode", async (ctx) => {
    if (!isAdmin(ctx)) return;
    try {
        const seriesList = await prisma.series.findMany({ select: { id: true, title: true }, orderBy: { createdAt: "desc" }, take: 10 });
        if (!seriesList || !seriesList.length) return ctx.reply("Hozircha bazada serial yo'q.");
        
        let text = "📼 Qism qo'shish uchun serial ID raqamini raqamda yozing:\n\n";
        seriesList.forEach(s => { text += `🔹 ID: ${s.id} | ${s.title}\n`; });
        
        adminStates.set(ctx.from.id, { flow: "add_episode", step: 1, data: {} });
        ctx.editMessageText(text, cancelBtn);
    } catch(e) {
        ctx.reply("Xatolik: Baza ulanmagan yoki xato.");
    }
  });

  bot.action("del_movies", async (ctx) => {
     if (!isAdmin(ctx)) return;
     try {
         const movies = await prisma.movie.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
         if (!movies.length) return ctx.reply("Filmlar topilmadi.");
         
         const buttons = movies.map(m => [Markup.button.callback(`🗑 ${m.title}`, `dx_mov_${m.id}`)]);
         buttons.push([Markup.button.callback("⬅️ Orqaga", "cancel_admin")]);
         
         ctx.editMessageText("O'chirmoqchi bo'lgan filmni tanlang (Oxirgi 20 ta):", Markup.inlineKeyboard(buttons));
     } catch(e) {}
  });

  bot.action("del_series", async (ctx) => {
     if (!isAdmin(ctx)) return;
     try {
         const series = await prisma.series.findMany({ orderBy: { createdAt: "desc" }, take: 20 });
         if (!series.length) return ctx.reply("Seriallar topilmadi.");
         
         const buttons = series.map(s => [Markup.button.callback(`🗑 ${s.title}`, `dx_ser_${s.id}`)]);
         buttons.push([Markup.button.callback("⬅️ Orqaga", "cancel_admin")]);
         
         ctx.editMessageText("O'chirmoqchi bo'lgan serialni tanlang:", Markup.inlineKeyboard(buttons));
     } catch(e) {}
  });

  bot.action(/^dx_mov_(\d+)$/, async (ctx) => {
      if (!isAdmin(ctx)) return;
      const id = Number(ctx.match[1]);
      try { await prisma.movie.delete({ where: { id } }); ctx.answerCbQuery("Film o'chirildi ✅"); ctx.editMessageText("Film muvaffaqiyatli o'chirildi."); } catch(e) { ctx.reply("O'chirishda xatolik."); }
  });

  bot.action(/^dx_ser_(\d+)$/, async (ctx) => {
      if (!isAdmin(ctx)) return;
      const id = Number(ctx.match[1]);
      try { await prisma.series.delete({ where: { id } }); ctx.answerCbQuery("Serial o'chirildi ✅"); ctx.editMessageText("Serial muvaffaqiyatli o'chirildi."); } catch(e) { ctx.reply("O'chirishda xatolik."); }
  });

  bot.action("admin_stats", async (ctx) => {
    if (!isAdmin(ctx)) return;
    try {
      const u = await prisma.user.count();
      const m = await prisma.movie.count();
      const s = await prisma.series.count();
      const e = await prisma.episode.count();
      ctx.editMessageText(`📊 Platforma Statistikasi:\n\n👥 Foydalanuvchilar: ${u} ta\n🎬 Filmlar: ${m} ta\n📺 Seriallar: ${s} ta\n📼 Jami qismlar: ${e} ta`, cancelBtn);
    } catch(e) {
      ctx.reply("Ma'lumot topilmadi.");
    }
  });

  bot.on("text", async (ctx, next) => {
    const state = adminStates.get(ctx.from.id);
    if (!state || !isAdmin(ctx)) return next();
    const text = ctx.message.text;

    try {
        if (state.flow === "add_movie") {
            if (state.step === 1) {
                state.data.title = text;
                state.step = 2;
                return ctx.reply("2️⃣ Film tavsifini (Opisaniye) yozing:", cancelBtn);
            }
            if (state.step === 2) {
                state.data.description = text;
                state.step = 3;
                return ctx.reply("3️⃣ Film posteri (Rasmning http ligi) yuboring:", cancelBtn);
            }
            if (state.step === 3) {
                state.data.poster = text;
                state.step = 4;
                return ctx.reply("4️⃣ Film tilini yozing (Masalan: O'zbek):", cancelBtn);
            }
            if (state.step === 4) {
                state.data.language = text;
                state.step = 5;
                return ctx.reply("5️⃣ Va nihoyat, filmning VIDEO faylini menga yuboring (Yoki forward qiling).", cancelBtn);
            }
        }
        
        if (state.flow === "add_series") {
            if (state.step === 1) {
                state.data.title = text;
                state.step = 2;
                return ctx.reply("2️⃣ Serial tavsifini yozing:", cancelBtn);
            }
            if (state.step === 2) {
                state.data.description = text;
                state.step = 3;
                return ctx.reply("3️⃣ Serial posteri (Rasm URL manzilini) yuboring:", cancelBtn);
            }
            if (state.step === 3) {
                state.data.poster = text;
                await prisma.series.create({ data: { title: state.data.title, description: state.data.description, poster: state.data.poster } });
                clearState(ctx.from.id);
                return ctx.reply("✅ Serial saqlandi! Endi \"Qism qo'shish\" menyusidan foydalanib videolarni yuklang.");
            }
        }

        if (state.flow === "add_episode") {
            if (state.step === 1) {
                const seriesId = parseInt(text);
                if (isNaN(seriesId)) return ctx.reply("Faqat ID raqam kiriting:", cancelBtn);
                state.data.seriesId = seriesId;
                state.step = 2;
                return ctx.reply("2️⃣ Nechanchi fasl (Sezon) ekanligini yozing (Masalan: 1):", cancelBtn);
            }
            if (state.step === 2) {
                const seasonNum = parseInt(text);
                if (isNaN(seasonNum)) return ctx.reply("Faqat raqam kiriting:", cancelBtn);
                state.data.seasonNum = seasonNum;
                state.step = 3;
                return ctx.reply("3️⃣ Nechanchi qism (Seriya) ekanligini yozing (Masalan: 5):", cancelBtn);
            }
            if (state.step === 3) {
                const epNum = parseInt(text);
                if (isNaN(epNum)) return ctx.reply("Faqat raqam:", cancelBtn);
                state.data.episodeNum = epNum;
                state.step = 4;
                return ctx.reply("4️⃣ Qism tilini yozing (Masalan: O'zbek):", cancelBtn);
            }
            if (state.step === 4) {
                state.data.language = text;
                state.step = 5;
                return ctx.reply("5️⃣ Qismning Video faylini shu chatga yuboring:", cancelBtn);
            }
        }
    } catch(e) {
        ctx.reply("❌ Xatolik yuz berdi DB ulanishida. /admin ni bosing.");
        clearState(ctx.from.id);
    }
  });

  bot.on("video", async (ctx, next) => {
      const state = adminStates.get(ctx.from.id);
      if (!state || !isAdmin(ctx)) return next();
      
      try {
          const fileId = ctx.message.video.file_id;

          if (state.flow === "add_movie" && state.step === 5) {
             const m = await ctx.reply("⏳ Yuklanmoqda... Bazaga saqlanmoqda...");
             await prisma.movie.create({
                 data: {
                     title: state.data.title,
                     description: state.data.description,
                     poster: state.data.poster,
                     languages: { create: [ { language: state.data.language, fileId: fileId } ] }
                 }
             });
             clearState(ctx.from.id);
             return ctx.telegram.editMessageText(m.chat.id, m.message_id, undefined, "✅ Film muvaffaqiyatli saqlandi! /admin ni bosib davom ettirishingiz mumkin.");
          }

          if (state.flow === "add_episode" && state.step === 5) {
             const m = await ctx.reply("⏳ Yuklanmoqda... Qism saqlanmoqda...");
             
             let season = await prisma.season.findFirst({ where: { seriesId: state.data.seriesId, seasonNum: state.data.seasonNum } });
             if (!season) season = await prisma.season.create({ data: { seriesId: state.data.seriesId, seasonNum: state.data.seasonNum } });
             
             let episode = await prisma.episode.findFirst({ where: { seasonId: season.id, episodeNum: state.data.episodeNum } });
             if (!episode) episode = await prisma.episode.create({ data: { seasonId: season.id, episodeNum: state.data.episodeNum } });

             await prisma.episodeLanguage.create({ data: { episodeId: episode.id, language: state.data.language, fileId: fileId } });

             clearState(ctx.from.id);
             return ctx.telegram.editMessageText(m.chat.id, m.message_id, undefined, "✅ Qism muvaffaqiyatli saqlandi! /admin ni bosib davom eting.");
          }
      } catch(e) {
          ctx.reply("❌ Xatolik yuz berdi saqlash davomida.");
          clearState(ctx.from.id);
      }
  });

  bot.launch().then(() => console.log("🤖 Telegram Bot To'liq Ishga Tushdi. (Yangi UI)"));
  process.once('SIGINT', () => bot?.stop('SIGINT'));
  process.once('SIGTERM', () => bot?.stop('SIGTERM'));
}

export { bot };
