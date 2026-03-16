export default function SelectField({
  label,
  name,
  register,
  error,
  options = [],
  placeholder = "Seleccionar...",
  fijoValue,
  disabledVisual = false,
  asNumber = false,
}) {
  const registerOptions = asNumber
    ? {
        setValueAs: (v) => {
          if (v === "" || v === null || v === undefined) return undefined;
          const n = Number(v);
          return Number.isNaN(n) ? undefined : n;
        },
      }
    : {
        setValueAs: (v) => String(v ?? "").trim(),
      };

  return (
    <div>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-semibold text-gray-700"
        >
          {label}
        </label>
      )}

      <select
        id={name}
        disabled={disabledVisual}
        {...register(name, registerOptions)}
        defaultValue={fijoValue ?? ""}
        className={[
          "mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring",
          disabledVisual
            ? "bg-gray-300 text-gray-800 border-gray-700 cursor-not-allowed"
            : "bg-white text-black border-gray-300",
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