import { Router } from "express";
import prisma from "./db";
import { z } from "zod";

const router = Router();

const tgAuthMiddleware = (req: any, res: any, next: any) => next();

router.get("/content", tgAuthMiddleware, async (req, res) => {
  try {
    const movies = await prisma.movie.findMany({
      include: { languages: true },
      orderBy: { createdAt: "desc" }
    });

    const series = await prisma.series.findMany({
      include: { seasons: { include: { episodes: { include: { languages: true } } } } },
      orderBy: { createdAt: "desc" }
    });

    res.json({ movies, series, error: false });
  } catch (error) {
    console.error("DB GET xatosi:", error);
    res.json({ movies: [], series: [], error: true });
  }
});

router.get("/movies/:id", tgAuthMiddleware, async (req, res) => {
  try {
    const movie = await prisma.movie.findUnique({
      where: { id: Number(req.params.id) },
      include: { languages: true }
    });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: "Xatolik" });
  }
});

router.get("/series/:id", tgAuthMiddleware, async (req, res) => {
  try {
    const series = await prisma.series.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        seasons: { 
          include: { 
            episodes: { include: { languages: true }, orderBy: { episodeNum: "asc" } } 
          }, 
          orderBy: { seasonNum: "asc" } 
        } 
      }
    });
    res.json(series);
  } catch (error) {
    res.status(500).json({ error: "Xatolik" });
  }
});

router.get("/search", tgAuthMiddleware, async (req, res) => {
  try {
    const query = String(req.query.q || "");
    if (!query) return res.json({ movies: [], series: [] });

    const movies = await prisma.movie.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      take: 20
    });

    const series = await prisma.series.findMany({
      where: { title: { contains: query, mode: "insensitive" } },
      take: 20
    });

    res.json({ movies, series });
  } catch (error) {
    res.status(500).json({ error: "Xatolik" });
  }
});

const watchSchema = z.object({
  telegramId: z.number(),
  fileId: z.string(),
  type: z.enum(["movie", "episode"]),
  id: z.number()
});

router.post("/watch", tgAuthMiddleware, async (req, res) => {
  try {
    const data = watchSchema.parse(req.body);
    const { bot } = require("./bot");
    
    if (bot) {
      await bot.telegram.sendVideo(data.telegramId, data.fileId, {
        caption: "✨ Marhamat, tanlagan videongiz! \n\n👀 Boshqa qism va filmlarni ilovadan izlang."
      });
      
      try {
          const user = await prisma.user.findUnique({ where: { telegramId: data.telegramId } });
          if (user) {
             await prisma.viewStat.create({
               data: {
                 userId: user.id,
                 movieId: data.type === 'movie' ? data.id : null,
               }
             });
          }
      } catch(e) { }

      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Bot ishlamayapti" });
    }
  } catch (error) {
    console.error("Watch endpoint error", error);
    res.status(400).json({ error: "Telegramga yuborishda xato" });
  }
});

export default router;
