import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { cn } from "../../lib/cn.js";
import { estaActiva } from "../../auth/permisos.js";
import ItemMenu from "./item_menu.jsx";
import Marca from "./marca.jsx";
import TarjetaUsuario from "./tarjeta_usuario.jsx";

/** Menú del panel en pantallas grandes. Se puede achicar a solo íconos para dar lugar a las tablas. */
export default function BarraLateral({ menu = [], actual = null, achicada = false, onAlternar }) {
  const Alternar = achicada ? PanelLeftOpen : PanelLeftClose;
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-white/5 bg-slate-950 transition-[width] duration-200 lg:flex",
        achicada ? "w-18" : "w-64",
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center gap-2 px-4", achicada ? "justify-center" : "justify-between")}>
        {!achicada && <Marca oscuro />}
        <button
          type="button"
          onClick={onAlternar}
          aria-label={achicada ? "Agrandar menú" : "Achicar menú"}
          title={achicada ? "Agrandar menú" : "Achicar menú"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sky-400"
        >
          <Alternar aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>

      <nav aria-label="Menú principal" className="dg-scroll-oscuro flex-1 overflow-y-auto px-3 pb-4">
        {menu.map((grupo) => (
          <div key={grupo.id} className="mt-4 first:mt-1">
            {grupo.titulo &&
              (achicada ? (
                <div aria-hidden="true" className="mx-3 mb-2 border-t border-white/10" />
              ) : (
                <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">{grupo.titulo}</p>
              ))}
            <ul className="space-y-0.5">
              {grupo.items.map((item) => (
                <li key={item.id}>
                  <ItemMenu item={item} activa={estaActiva(item, actual)} soloIcono={achicada} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <TarjetaUsuario oscuro compacta={achicada} />
      </div>
    </aside>
  );
}
