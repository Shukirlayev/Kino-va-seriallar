import { Router } from "express";
import prisma from "./db";
import { z } from "zod";

const router = Router();

// Validate Telegram InitData (Mock verification or proper HMAC validation)
// In a true environment we'd validate initData hash using Bot Token.
const tgAuthMiddleware = (req: any, res: any, next: any) => {
  // Simplified for this scope: Ensure a custom header or query exists.
  // Full validation would parse `window.Telegram.WebApp.initData` and create crypto hash.
  next();
};

// --- GET ALL CONTENT ---
router.get("/content", tgAuthMiddleware, async (req, res) => {
  try {
    // If DB isn't configured in AI Studio, handle gracefully for preview purposes
    if (!process.env.DATABASE_URL) {
      return res.json({ movies: [], series: [] });
    }

    const movies = await prisma.movie.findMany({
      include: { languages: true },
      orderBy: { createdAt: "desc" }
    });

    const series = await prisma.series.findMany({
      include: { seasons: { include: { episodes: { include: { languages: true } } } } },
      orderBy: { createdAt: "desc" }
    });

    res.json({ movies, series });
  } catch (error) {
    console.error("Failed to fetch content:", error);
    res.status(500).json({ error: "Ma'lumotni yuklashda xatolik yuz berdi" }); // Error fetching data
  }
});

// --- GET MOVIE BY ID ---
router.get("/movies/:id", tgAuthMiddleware, async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) return res.json(null);
    const movie = await prisma.movie.findUnique({
      where: { id: Number(req.params.id) },
      include: { languages: true }
    });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Xatolik" });
  }
});

// --- GET SERIES BY ID ---
router.get("/series/:id", tgAuthMiddleware, async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) return res.json(null);
    const series = await prisma.series.findUnique({
      where: { id: Number(req.params.id) },
      include: { seasons: { include: { episodes: { include: { languages: true } } }, orderBy: { seasonNum: "asc" } } }
    });
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: "Xatolik" });
  }
});

// --- SEARCH ---
router.get("/search", tgAuthMiddleware, async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) return res.json({ movies: [], series: [] });
    const query = String(req.query.q || "");
    
    if (!query) {
      return res.json({ movies: [], series: [] });
    }

    const movies = await prisma.movie.findMany({
      where: {
        title: { contains: query, mode: "insensitive" }
      },
      take: 20
    });

    const series = await prisma.series.findMany({
      where: {
        title: { contains: query, mode: "insensitive" }
      },
      take: 20
    });

    res.json({ movies, series });
  } catch (error) {
    res.status(500).json({ error: "Xatolik" });
  }
});

// --- REQUEST VIDEO TO BE SENT BY BOT ---
const watchSchema = z.object({
  telegramId: z.number(),
  fileId: z.string(),
  type: z.enum(["movie", "episode"]),
  id: z.number()
});

router.post("/watch", tgAuthMiddleware, async (req, res) => {
  try {
    const data = watchSchema.parse(req.body);
    
    // In actual implementation, we send an IPC message, 
    // or if the bot object is globally accessible, we can send direct.
    // For separation of concerns, we can emit an event or directly import the bot here.
    const { bot } = require("./bot");
    if (bot) {
      await bot.telegram.sendVideo(data.telegramId, data.fileId, {
        caption: "Marhamat, tanlagan videongiz! \n\n🎬 Boshqa filmlarni izlash uchun ilovamizdan foydalaning."
      });
      
      // Update View Stats
      if (process.env.DATABASE_URL) {
        let userId = req.body.userId; 
        const user = await prisma.user.findUnique({ where: { telegramId: data.telegramId } });
        if (user) {
           await prisma.viewStat.create({
             data: {
               userId: user.id,
               movieId: data.type === 'movie' ? data.id : null,
             }
           });
        }
      }

      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Bot ishlamayapti" });
    }
  } catch (error) {
    console.error("Watch endpoint error", error);
    res.status(400).json({ error: "Telegramga yuborishda xatolik yuz berdi" });
  }
});

export default router;
