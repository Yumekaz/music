import { Router } from "express";
import { getProviderStatus } from "../config/env.js";

const router = Router();

router.get("/status", (_request, response) => {
  response.json(getProviderStatus());
});

export default router;
