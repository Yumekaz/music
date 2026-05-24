import cors from "cors";
import express from "express";
import { errorHandler, notFound } from "./middleware/validate.js";
import albumsRoutes from "./routes/albums.routes.js";
import artistsRoutes from "./routes/artists.routes.js";
import audioRoutes from "./routes/audio.routes.js";
import discoveryRoutes from "./routes/discovery.routes.js";
import providersRoutes from "./routes/providers.routes.js";
import searchRoutes from "./routes/search.routes.js";
import tracksRoutes from "./routes/tracks.routes.js";
import { getProviderStatusSnapshot } from "./services/providerHealth.service.js";

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
      name: "reverb-api",
      providerStatus: getProviderStatusSnapshot()
    });
  });

  app.use("/api/search", searchRoutes);
  app.use("/api/audio", audioRoutes);
  app.use("/api/tracks", tracksRoutes);
  app.use("/api/artists", artistsRoutes);
  app.use("/api/albums", albumsRoutes);
  app.use("/api/discovery", discoveryRoutes);
  app.use("/api/providers", providersRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
