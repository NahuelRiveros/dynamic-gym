import { Link } from "react-router-dom";
import { images } from "../../../assets/index.js";

/** Logo + nombre del sitio público (barra y footer). El nombre no se corta nunca, tampoco en celular. */
export default function MarcaPublica() {
  return (
    <Link
      to="/"
      aria-label="Dynamic Gym, ir al inicio"
      className="inline-flex min-h-11 shrink-0 items-center gap-2 outline-none focus-visible:ring-3 focus-visible:ring-cobalto sm:gap-2.5"
    >
      <img src={images.dynamicLogo} alt="" className="h-9 w-9 rounded-full object-cover sm:h-11 sm:w-11" />
      <span className="dg-display text-[1.3rem] leading-none font-black whitespace-nowrap uppercase sm:text-[1.75rem]">Dynamic Gym</span>
    </Link>
  );
}
