/** Props para una fila (o tarjeta) que se abre con click o con Enter/Espacio desde el teclado. */
export function propsFilaClickeable(onRowClick, fila) {
  if (!onRowClick) return {};
  return {
    tabIndex: 0,
    onClick: () => onRowClick(fila),
    onKeyDown: (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onRowClick(fila);
      }
    },
  };
}
