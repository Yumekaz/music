import { Router } from "express";
import { z } from "zod";
import { validateQuery } from "../middleware/validate.js";
import { getAvailability } from "../services/availability.service.js";
import { getLyricsForTrackId } from "../services/lyrics.service.js";
import { getTrackById, resolveTrack } from "../services/resolver.service.js";

const router = Router();

router.get(
  "/resolve",
  validateQuery(
    z.object({
      title: z.string().trim().min(1),
      artist: z.string().trim().min(1)
    })
  ),
  async (request, response, next) => {
    try {
      response.json(await resolveTrack(request.queryInput));
    } catch (error) {
      next(error);
    }
  }
);

router.get("/:id", async (request, response, next) => {
  try {
    const track = await getTrackById(request.params.id);
    if (!track) {
      response.status(404).json({ error: "Track not found" });
      return;
    }
    response.json(track);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/lyrics", async (request, response, next) => {
  try {
    const { title, artist } = request.query;
    const lyrics = await getLyricsForTrackId(request.params.id, title, artist);
    if (!lyrics) {
      response.status(404).json({ error: "Lyrics not found" });
      return;
    }
    response.json(lyrics);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/availability", async (request, response, next) => {
  try {
    const availability = await getAvailability(request.params.id);
    if (!availability) {
      response.status(404).json({ error: "Availability not found" });
      return;
    }
    response.json(availability);
  } catch (error) {
    next(error);
  }
});

export default router;
