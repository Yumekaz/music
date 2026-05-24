import { useState } from "react";

export function ImageWithFallback({ src, alt, className = "" }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const fallbackClass = `grid place-items-center text-night bg-accent text-[2rem] font-black w-full object-cover ${className}`;
    return (
      <div className={fallbackClass} aria-label={alt}>
        <span>{alt?.slice(0, 1) || "M"}</span>
      </div>
    );
  }

  return <img className={`w-full object-cover bg-[#101510] ${className}`} src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />;
}
