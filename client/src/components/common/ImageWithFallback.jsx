import { useState } from "react";

export function ImageWithFallback({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`image-fallback ${className}`} aria-label={alt}>
        <span>{alt?.slice(0, 1) || "M"}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
