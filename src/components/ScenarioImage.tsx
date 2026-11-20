import { useState } from "react";
import { Globe2 } from "lucide-react";

interface ScenarioImageProps {
  src?: string;
  alt: string;
  title: string;
  fallbackGradient: string;
  className?: string;
  scrim?: boolean;
}

export function ScenarioImage({
  src,
  alt,
  title,
  fallbackGradient,
  className = "",
  scrim = false,
}: ScenarioImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`relative overflow-hidden bg-gradient-to-br ${fallbackGradient} flex flex-col items-center justify-center text-white/80 p-4 ${className}`}
      >
        <Globe2 className="w-6 h-6 mb-1.5 opacity-75" aria-hidden="true" />
        <span className="text-xs font-medium text-center line-clamp-2 opacity-90">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-slate-900 ${className}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover"
      />
      {scrim && (
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/25 to-transparent pointer-events-none"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
