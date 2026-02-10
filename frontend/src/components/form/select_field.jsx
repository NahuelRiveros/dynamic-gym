export default function SelectField({
  label,
  name,
  register,
  error,
  options = [],
  placeholder = "Seleccionar...",
  fijoValue,
  disabledVisual = false,
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}

      <select
        {...register(name, { valueAsNumber: true })}
        defaultValue={fijoValue ?? ""}
        className={[
          "text-black mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring",
          disabledVisual ? "bg-gray-200 opacity-70 pointer-events-none" : "",
        ].join(" ")}
      >
        <option value="">{placeholder}</option>

        {options.map((op) => (
          <option key={op.value} value={op.value}>
            {op.label}
          </option>
        ))}
      </select>

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}
