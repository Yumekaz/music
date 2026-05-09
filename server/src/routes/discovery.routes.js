import { Router } from "express";
import { getTrending, getRecommendations } from "../services/discovery.service.js";
import { getCharts } from "../services/search.service.js";

const router = Router();

router.get("/trending", async (request, response, next) => {
  try {
    response.json({ tracks: await getTrending(String(request.query.region || "IN")) });
  } catch (error) {
    next(error);
  }
});

router.get("/charts", async (_request, response, next) => {
  try {
    response.json(await getCharts());
  } catch (error) {
    next(error);
  }
});

router.post("/recommendations", async (request, response, next) => {
  try {
    const { artists = [] } = request.body || {};
    const seedArtists = artists.slice(0, 5); // Max 5 seed artists
    const sections = await getRecommendations(seedArtists);
    response.json({ sections });
  } catch (error) {
    next(error);
  }
});

export default router;

