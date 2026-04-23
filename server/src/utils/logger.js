export const logger = {
  info: (...args) => console.log("[music-api]", ...args),
  warn: (...args) => console.warn("[music-api]", ...args),
  error: (...args) => console.error("[music-api]", ...args)
};
