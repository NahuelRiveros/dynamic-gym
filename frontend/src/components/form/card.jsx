// src/components/ui/Card.jsx
export default function Card({
  title,
  value,
  subtitle,
  icon,
  right,
  tone = "default",     // "default" | "ok" | "danger" | "warn" | "info"
  size = "md",          // "sm" | "md" | "lg"
  loading = false,
  onClick,
  className = "",
  children,
}) {
  const toneMap = {
    default: {
      ring: "border-gray-200",
      icon: "bg-gray-50 text-gray-700 border-gray-200",
      badge: "bg-gray-50 text-gray-700 border-gray-200",
    },
    ok: {
      ring: "border-green-200",
      icon: "bg-green-50 text-green-700 border-green-200",
      badge: "bg-green-50 text-green-700 border-green-200",
    },
    danger: {
      ring: "border-red-200",
      icon: "bg-red-50 text-red-700 border-red-200",
      badge: "bg-red-50 text-red-700 border-red-200",
    },
    warn: {
      ring: "border-yellow-200",
      icon: "bg-yellow-50 text-yellow-800 border-yellow-200",
      badge: "bg-yellow-50 text-yellow-800 border-yellow-200",
    },
    info: {
      ring: "border-blue-200",
      icon: "bg-blue-50 text-blue-700 border-blue-200",
      badge: "bg-blue-50 text-blue-700 border-blue-200",
    },
  };

  const sz = {
    sm: { p: "p-4", title: "text-xs", value: "text-xl", subtitle: "text-xs", icon: "h-9 w-9" },
    md: { p: "p-5", title: "text-xs", value: "text-2xl", subtitle: "text-xs", icon: "h-10 w-10" },
    lg: { p: "p-6", title: "text-sm", value: "text-3xl", subtitle: "text-sm", icon: "h-11 w-11" },
  }[size] ?? {
    p: "p-5", title: "text-xs", value: "text-2xl", subtitle: "text-xs", icon: "h-10 w-10",
  };

  const t = toneMap[tone] ?? toneMap.default;

  const clickable = typeof onClick === "function";

  return (
    <div
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!clickable) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      className={[
        "rounded-3xl border bg-white shadow-sm",
        t.ring,
        sz.p,
        clickable ? "cursor-pointer hover:shadow-md transition active:scale-[0.99]" : "",
        className,
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={["text-gray-500 font-semibold", sz.title].join(" ")}>
            {title ?? "—"}
          </div>

          {loading ? (
            <div className="mt-3 h-7 w-24 rounded bg-gray-100 animate-pulse" />
          ) : (
            <div className={["mt-2 font-extrabold text-gray-900", sz.value].join(" ")}>
              {value ?? "—"}
            </div>
          )}

          {subtitle ? (
            loading ? (
              <div className="mt-2 h-4 w-40 rounded bg-gray-100 animate-pulse" />
            ) : (
              <div className={["mt-1 text-gray-500", sz.subtitle].join(" ")}>
                {subtitle}
              </div>
            )
          ) : null}
        </div>

        {/* Right side (icon / badge / actions) */}
        <div className="flex items-center gap-2 shrink-0">
          {right ? (
            <div className={["inline-flex items-center rounded-2xl border px-2.5 py-1 text-xs font-semibold", t.badge].join(" ")}>
              {right}
            </div>
          ) : null}

          {icon ? (
            <div className={["rounded-2xl border flex items-center justify-center", t.icon, sz.icon].join(" ")}>
              {icon}
            </div>
          ) : null}
        </div>
      </div>

      {/* Custom content */}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}