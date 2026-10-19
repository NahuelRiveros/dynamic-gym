import { estaActiva } from "../../../auth/permisos.js";
import ItemMenu from "./item_menu.jsx";

/** Un grupo de la barra lateral: su título (achicada, una línea divisoria) y sus pantallas. */
export default function GrupoMenu({ grupo, actual = null, achicada = false }) {
  return (
    <div className="mt-4 first:mt-1">
      {grupo.titulo &&
        (achicada ? (
          <div aria-hidden="true" className="mx-3 mb-2 border-t border-white/10" />
        ) : (
          <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{grupo.titulo}</p>
        ))}
      <ul className="space-y-0.5">
        {grupo.items.map((item) => (
          <li key={item.id}>
            <ItemMenu item={item} activa={estaActiva(item, actual)} soloIcono={achicada} />
          </li>
        ))}
      </ul>
    </div>
  );
}
