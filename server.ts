import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import { createServer as createViteServer } from "vite";
import apiRouter from "./server/api";
import { setupBot } from "./server/bot";

const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();

  // Security and Middlewares
  app.use(helmet({ contentSecurityPolicy: false })); // Disabled CSP for Telegram WebApp iframe
  app.use(cors());
  app.use(express.json());

  // Mount API
  app.use("/api", apiRouter);

  // Initialize Telegram Bot
  setupBot();

  // Vite Middleware for Frontend Development / Serve Static Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Error boundary
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Express Error:", err);
    res.status(500).json({ error: "Ichki server xatosi" }); // Internal server error in Uzbek
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();
