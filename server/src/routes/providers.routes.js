import { Router } from "express";
import { getProviderStatusSnapshot } from "../services/providerHealth.service.js";

const router = Router();

router.get("/status", (_request, response) => {
  response.json(getProviderStatusSnapshot());
});

export default router;
