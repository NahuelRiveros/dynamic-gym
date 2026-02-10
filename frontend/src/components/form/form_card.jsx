export default function FormCard({ titulo, subtitulo, children }) {
  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow p-6">
      {titulo && <h1 className="text-2xl font-bold">{titulo}</h1>}
      {subtitulo && (
        <p className="text-sm text-gray-600 mt-1">{subtitulo}</p>
      )}

      <div className="mt-6">{children}</div>
    </div>
  );
}
