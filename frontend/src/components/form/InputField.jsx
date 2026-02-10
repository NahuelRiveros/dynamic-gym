export default function InputField({
  label,
  name,
  register,
  error,
  type = "",
  placeholder = "",
  inputMode,
  autoComplete,
}) {
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
        className="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
      />

      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
