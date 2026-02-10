export default function SubmitButton({
  label,
  loading = false,
  loadingLabel = "Procesando...",
  disabled = false,
  type = "submit",
  onClick,
  className = "",
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        "inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold",
        "border border-white/10 bg-green-600 text-white",
        "hover:bg-green-700 active:scale-[0.99] transition",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600",
        className,
      ].join(" ")}
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
