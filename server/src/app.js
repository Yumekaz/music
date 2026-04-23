import cors from "cors";
import express from "express";
import { getProviderStatus } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/validate.js";
import albumsRoutes from "./routes/albums.routes.js";
import artistsRoutes from "./routes/artists.routes.js";
import discoveryRoutes from "./routes/discovery.routes.js";
import providersRoutes from "./routes/providers.routes.js";
import searchRoutes from "./routes/search.routes.js";
import tracksRoutes from "./routes/tracks.routes.js";

export function createApp({ corsOrigin } = {}) {
  const app = express();

  app.use(
    cors({
      origin: corsOrigin || process.env.CORS_ORIGIN || "http://localhost:5173"
    })
  );
  app.use(express.json());

  app.get("/api/health", (_request, response) => {
    response.json({
      ok: true,
      name: "music-app-v3-api",
      providerStatus: getProviderStatus()
    });
  });

  app.use("/api/search", searchRoutes);
  app.use("/api/tracks", tracksRoutes);
  app.use("/api/artists", artistsRoutes);
  app.use("/api/albums", albumsRoutes);
  app.use("/api/discovery", discoveryRoutes);
  app.use("/api/providers", providersRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
