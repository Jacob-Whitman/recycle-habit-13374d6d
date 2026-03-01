import banditImg from "@/art/bandit.png";
import bandanaImg from "@/art/bandana.png";
import beanieImg from "@/art/beanie.png";
import cowboyImg from "@/art/cowboy.png";
import crownImg from "@/art/crown.png";

type HatEntry =
  | { label: string; src: string }
  | { label: string; src: null };

const HATS: Record<string, HatEntry> = {
  none: { label: "No Hat", src: null },
  bandana: { label: "Bandana", src: bandanaImg },
  beanie: { label: "Beanie", src: beanieImg },
  cowboy: { label: "Cowboy", src: cowboyImg },
  crown: { label: "Crown", src: crownImg },
};

interface BanditProps {
  hatId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showHatPicker?: boolean;
  onHatChange?: (hatId: string) => void;
}

const HAT_OVERLAY_SIZE = {
  sm: "w-10 h-10 -top-1",
  md: "w-14 h-14 -top-2",
  lg: "w-20 h-20 -top-3",
};

export default function Bandit({ hatId = "none", size = "md", className = "", showHatPicker = false, onHatChange }: BanditProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-28 h-28",
    lg: "w-40 h-40",
  };

  const hat = HATS[hatId] || HATS.none;

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative inline-block">
        <img
          src={banditImg}
          alt="Bandit the recycling raccoon"
          className={`${sizeClasses[size]} object-contain drop-shadow-lg`}
        />
        {hat.src && (
          <img
            src={hat.src}
            alt=""
            role="presentation"
            className={`absolute left-1/2 -translate-x-1/2 object-contain pointer-events-none ${HAT_OVERLAY_SIZE[size]} animate-bounce-in`}
          />
        )}
      </div>

      {showHatPicker && (
        <div className="flex flex-wrap justify-center gap-1.5 max-w-[220px]">
          {Object.entries(HATS).map(([id, h]) => (
            <button
              key={id}
              onClick={() => onHatChange?.(id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all overflow-hidden
                ${hatId === id
                  ? "ring-2 ring-primary ring-offset-2 scale-110"
                  : "bg-card hover:bg-accent"
                }`}
              aria-label={h.label}
              title={h.label}
            >
              {h.src ? (
                <img src={h.src} alt="" className="w-full h-full object-contain" />
              ) : (
                <span className="text-muted-foreground text-xs">None</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export { HATS };
