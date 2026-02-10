import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

export default function CarouselGym({
  slides = [],
  autoPlay = true,
  intervalMs = 6500,
  showDots = true,
  className = "",
}) {
  const total = slides.length;
  const [idx, setIdx] = useState(0);

  const safeIdx = useMemo(() => {
    if (!total) return 0;
    return Math.min(idx, total - 1);
  }, [idx, total]);

  useEffect(() => {
    if (!autoPlay || total <= 1) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % total),
      intervalMs
    );
    return () => clearInterval(t);
  }, [autoPlay, intervalMs, total]);

  function prev() {
    if (!total) return;
    setIdx((i) => (i - 1 + total) % total);
  }

  function next() {
    if (!total) return;
    setIdx((i) => (i + 1) % total);
  }

  if (!slides.length) return null;
  const slide = slides[safeIdx];

  return (
    <div
      className={[
        "w-full overflow-hidden rounded-3xl",
        "border border-white/10 bg-black text-white shadow-2xl",
        className,
      ].join(" ")}
    >
      {/* ================= IMAGEN ================= */}
      <div className="relative h-72 md:h-[460px]">
        {slide.image && (
          <img
            src={slide.image}
            alt={slide.title}
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {(slide.kicker || slide.icon) && (
          <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-gray-500/40 px-4 py-1 text-md font-semibold text-green-300">
            {slide.icon}
            <span>{slide.kicker}</span>
          </div>
        )}

        <div className="absolute bottom-5 left-5 right-5">
          <h3 className="text-3xl md:text-4xl font-extrabold">
            {slide.title}{" "}
            {slide.highlight && (
              <span className="text-green-500">
                {slide.highlight}
              </span>
            )}
          </h3>

          {slide.subtitle && (
            <p className="mt-2 text-gray-200 md:text-lg max-w-3xl">
              {slide.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ================= TEXTO ================= */}
      <div className="px-6 md:px-10 py-8">
        {slide.text && (
          <p className="text-gray-300 md:text-lg max-w-4xl">
            {slide.text}
          </p>
        )}

        {/* ================= POINTS CON ICONOS ================= */}
        {Array.isArray(slide.points) && slide.points.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {slide.points.map((p, i) => {
              const Icon = p.icon;

              const content = (
                <>
                  {/* Icono */}
                  {Icon && (
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600/20 text-green-400">
                      <Icon size={22} />
                    </div>
                  )}

                  {/* Texto */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-semibold">
                      {p.label}
                      {p.href && (
                        <ExternalLink size={14} className="opacity-70" />
                      )}
                    </div>
                    {p.description && (
                      <div className="text-sm text-gray-400 mt-0.5">
                        {p.description}
                      </div>
                    )}
                  </div>
                </>
              );

              return p.href ? (
                <a
                  key={`${safeIdx}-${i}`}
                  href={p.href}
                  target={p.external ? "_blank" : "_self"}
                  rel="noopener noreferrer"
                  className="
                    flex items-start gap-4 rounded-2xl border border-white/10
                    bg-white/5 p-4 transition
                    hover:bg-white/10 hover:border-green-500/40
                    cursor-pointer
                  "
                >
                  {content}
                </a>
              ) : (
                <div
                  key={`${safeIdx}-${i}`}
                  className="
                    flex items-start gap-4 rounded-2xl border border-white/10
                    bg-white/5 p-4
                  "
                >
                  {content}
                </div>
              );
            })}
          </div>
        )}

        {/* ================= CONTROLES ================= */}
        {total > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={prev}
              className="rounded-xl border border-white/15 bg-white/5 p-2 hover:bg-white/10"
            >
              <ChevronLeft />
            </button>

            {showDots && (
              <div className="flex gap-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setIdx(i)}
                    className={[
                      "h-2.5 w-2.5 rounded-full border",
                      i === safeIdx
                        ? "bg-green-500 border-green-500"
                        : "bg-white/20 border-white/30",
                    ].join(" ")}
                  />
                ))}
              </div>
            )}

            <button
              onClick={next}
              className="rounded-xl border border-white/15 bg-white/5 p-2 hover:bg-white/10"
            >
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
