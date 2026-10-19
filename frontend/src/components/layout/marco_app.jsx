import { useLocation } from "react-router-dom";
import { useAuth } from "../../auth/auth_context.jsx";
import { barraInferiorPara, estaActiva, menuPara, pantallaDeRuta } from "../../auth/permisos.js";
import { useMenuAchicado } from "../../hook/use_menu_achicado.js";
import { cn } from "../../lib/cn.js";
import BarraInferior from "./movil/barra_inferior.jsx";
import BarraLateral from "./panel/barra_lateral.jsx";
import EncabezadoPanel from "./panel/encabezado_panel.jsx";
import Footer from "./publico/footer.jsx";
import NavbarPublica from "./publico/navbar_publica.jsx";

/**
 * Marco de toda la app. Con sesión: barra lateral (compu), barra inferior (celular) y el título de
 * la pantalla arriba. Sin sesión: barra pública y footer.
 * El contenido queda SIEMPRE en el mismo lugar del árbol: así, al iniciar sesión React no vuelve a
 * montar la pantalla (el login no pierde su cartel de bienvenida).
 * `--barra-inferior` le dice a los avisos flotantes cuánto subir para no tapar la barra del celular.
 */
export default function MarcoApp({ children }) {
  const { usuario, isAuth, cargando } = useAuth();
  const { pathname } = useLocation();
  const [achicada, alternar] = useMenuAchicado();

  const menu = menuPara(usuario);
  const actual = pantallaDeRuta(pathname);
  const grupo = menu.find((g) => g.titulo && g.items.some((item) => estaActiva(item, actual)));
  const publica = !isAuth && !cargando;

  return (
    <div className={cn("min-h-dvh", isAuth ? "bg-slate-50 [--barra-inferior:4rem] lg:[--barra-inferior:0px]" : "bg-gray-50")}>
      {isAuth && <BarraLateral menu={menu} actual={actual} achicada={achicada} onAlternar={alternar} />}

      <div className={cn(isAuth && "transition-[padding] duration-200", isAuth && (achicada ? "lg:pl-18" : "lg:pl-64"))}>
        {isAuth && <EncabezadoPanel grupo={grupo?.titulo} titulo={actual?.titulo} />}
        {publica && <NavbarPublica />}
        <main className={cn(isAuth && "pb-[calc(var(--barra-inferior)+env(safe-area-inset-bottom))]")}>{children}</main>
        {publica && !actual?.sinFooter && <Footer />}
      </div>

      {isAuth && <BarraInferior accesos={barraInferiorPara(usuario)} menu={menu} actual={actual} />}
    </div>
  );
}
