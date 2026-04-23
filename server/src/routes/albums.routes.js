import { Router } from "express";
import { getAlbum } from "../services/album.service.js";

const router = Router();

router.get("/:id", async (request, response, next) => {
  try {
    const album = await getAlbum(request.params.id);
    if (!album) {
      response.status(404).json({ error: "Album not found" });
      return;
    }
    response.json(album);
  } catch (error) {
    next(error);
  }
});

export default router;
