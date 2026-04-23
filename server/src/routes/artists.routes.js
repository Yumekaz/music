import { Router } from "express";
import { getArtistProfile, getArtistSimilar, getArtistTopTracks } from "../services/artist.service.js";

const router = Router();

router.get("/:id", async (request, response, next) => {
  try {
    const artist = await getArtistProfile(request.params.id);
    if (!artist) {
      response.status(404).json({ error: "Artist not found" });
      return;
    }
    response.json(artist);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/similar", async (request, response, next) => {
  try {
    const similar = await getArtistSimilar(request.params.id);
    if (!similar) {
      response.status(404).json({ error: "Artist not found" });
      return;
    }
    response.json({ artists: similar });
  } catch (error) {
    next(error);
  }
});

router.get("/:id/top-tracks", async (request, response, next) => {
  try {
    const tracks = await getArtistTopTracks(request.params.id);
    if (!tracks) {
      response.status(404).json({ error: "Artist not found" });
      return;
    }
    response.json({ tracks });
  } catch (error) {
    next(error);
  }
});

export default router;
