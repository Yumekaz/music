import { useEffect, useState } from "react";

/**
 * Extract the dominant color from an image URL.
 * Uses an offscreen canvas to sample pixels.
 * Returns a CSS-compatible rgb string like "30, 50, 80".
 */
export function useColorExtract(imageUrl) {
  const [color, setColor] = useState(null);

  useEffect(() => {
    if (!imageUrl) {
      setColor(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 64;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, size, size);
        const data = ctx.getImageData(0, 0, size, size).data;

        // Bucket dominant color — skip very dark/bright pixels
        const buckets = {};
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = r + g + b;
          if (brightness < 30 || brightness > 700) continue;
          // Quantize to 32-step buckets
          const key = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
          buckets[key] = (buckets[key] || 0) + 1;
        }

        let best = null;
        let maxCount = 0;
        for (const [key, count] of Object.entries(buckets)) {
          if (count > maxCount) {
            maxCount = count;
            best = key;
          }
        }

        setColor(best || "40, 40, 40");
      } catch {
        setColor(null);
      }
    };

    img.onerror = () => setColor(null);
  }, [imageUrl]);

  return color;
}
