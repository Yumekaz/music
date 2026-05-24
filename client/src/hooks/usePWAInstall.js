import { useCallback, useEffect, useState } from "react";

let deferredPrompt = null;
let listening = false;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener(deferredPrompt));
}

function ensureInstallPromptListener() {
  if (listening || typeof window === "undefined") return;
  listening = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notifyListeners();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notifyListeners();
  });
}

export function usePWAInstall() {
  const [prompt, setPrompt] = useState(deferredPrompt);

  useEffect(() => {
    ensureInstallPromptListener();
    listeners.add(setPrompt);
    setPrompt(deferredPrompt);
    return () => listeners.delete(setPrompt);
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    const promptToShow = deferredPrompt;
    await promptToShow.prompt();
    deferredPrompt = null;
    notifyListeners();
  }, []);

  return { canInstall: Boolean(prompt), install };
}
