export default function InputField({
  label,
  name,
  register,
  error,
  type = "text",
  placeholder = "",
  inputMode,
  autoComplete,
  className = "",
}) {
  const baseStyles =
    "mt-1 w-full rounded-xl border px-3 py-2 outline-none transition focus:ring-2";

  const errorStyles = error
    ? "border-red-400 focus:ring-red-200"
    : "border-gray-300 focus:ring-green-200";

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className={`${baseStyles} ${errorStyles} ${className}`}
      />

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}