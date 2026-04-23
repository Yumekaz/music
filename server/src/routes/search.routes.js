import { Router } from "express";
import { z } from "zod";
import { validateQuery } from "../middleware/validate.js";
import { searchCatalog } from "../services/search.service.js";

const router = Router();

router.get(
  "/",
  validateQuery(
    z.object({
      q: z.string().trim().min(1),
      limit: z.coerce.number().int().min(1).max(25).default(8)
    })
  ),
  async (request, response, next) => {
    try {
      const { q, limit } = request.queryInput;
      response.json(await searchCatalog(q, limit));
    } catch (error) {
      next(error);
    }
  }
);

export default router;
