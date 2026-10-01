/** Errores de un formulario, anunciados por el lector de pantalla al aparecer. */
export default function ListaErrores({ errores = [] }) {
  if (errores.length === 0) return null;

  return (
    <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {errores.length === 1 ? (
        errores[0]
      ) : (
        <ul className="list-disc pl-5">
          {errores.map((error) => <li key={error}>{error}</li>)}
        </ul>
      )}
    </div>
  );
}
