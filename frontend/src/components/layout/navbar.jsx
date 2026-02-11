import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { navConfig } from "./navbar_config.js";

function tieneRol(usuario, rolesPermitidos) {
  if (!rolesPermitidos || rolesPermitidos.length === 0) return true;
  const rolesUsuario = usuario?.roles || [];
  return rolesPermitidos.some((r) => rolesUsuario.includes(r));
}

export default function Navbar({ usuario = null, onLogout }) {
  const { pathname } = useLocation();

  const cfg = navConfig;
  const t = cfg.theme;
  const l = cfg.layout;
  const labels = cfg.labels;

  const [menuAbierto, setMenuAbierto] = useState(false);
  const [dropdownAbierto, setDropdownAbierto] = useState({}); // { admin: true, ... }

  function cerrarTodo() {
    setMenuAbierto(false);
    setDropdownAbierto({});
  }

  function toggleDropdown(id) {
    // abre uno y cierra los demás
    setDropdownAbierto((prev) => {
      const nuevo = {};
      const estabaAbierto = !!prev[id];
      if (!estabaAbierto) nuevo[id] = true;
      return nuevo;
    });
  }

  function cerrarDropdown(id) {
    setDropdownAbierto((prev) => ({ ...prev, [id]: false }));
  }

  function linkClass(to) {
    const activo = pathname === to;
    const base = `block px-3 py-2 ${l.radioItem} text-sm font-semibold`;

    if (activo) return `${base} ${t.linkActive.bg} ${t.linkActive.text}`;
    return `${base} ${t.link.text} ${t.link.hoverBg} ${t.link.hoverText || ""}`;
  }

  // ========= Links visibles =========
  const linksVisibles = useMemo(() => {
    return (cfg.links || []).filter((x) => {
      if (x.requiereAuth && !usuario) return false;
      if (x.ocultarSiAuth && usuario) return false;
      if (!tieneRol(usuario, x.roles)) return false;
      return true;
    });
  }, [cfg.links, usuario]);

  // ========= Dropdowns visibles (con items filtrados) =========
  const dropdownsVisibles = useMemo(() => {
    return (cfg.dropdowns || [])
      .map((dd) => {
        const itemsVisibles = (dd.items || []).filter((it) => {
          if (it.requiereAuth && !usuario) return false;
          if (it.ocultarSiAuth && usuario) return false;
          if (!tieneRol(usuario, it.roles)) return false;
          return true;
        });
        return { ...dd, itemsVisibles };
      })
      .filter((dd) => dd.itemsVisibles.length > 0);
  }, [cfg.dropdowns, usuario]);

  return (
    <header className={`${t.navbar.bg} ${t.navbar.border}`}>
      <div className={`${l.container} ${cfg.layout.altoBarra}`}>
        <div className="flex items-center justify-between">
          {/* Brand */}
          <Link
            to={cfg.brand.linkTo || "/"}
            className="flex items-center gap-2"
            onClick={cerrarTodo}
          >
            {cfg.brand.logoUrl ? (
              <img
                src={cfg.brand.logoUrl}
                alt="Logo"
                className={`h-9 w-9 ${l.radioItem} object-cover`}
              />
            ) : (
              <div
                className={`h-9 w-9 ${l.radioItem} flex items-center justify-center font-bold
                ${t.brand.fallbackBg} ${t.brand.fallbackText}`}
              >
                {cfg.brand.fallbackLetter || cfg.brand.titulo?.[0] || "A"}
              </div>
            )}

            <div className="leading-tight">
              {cfg.brand.mostrarTitulo !== false && (
                <div className={`font-bold text-lg ${t.brand.titleText}`}>
                  {cfg.brand.titulo || "App"}
                </div>
              )}
              {cfg.brand.mostrarSubtitulo && cfg.brand.subtitulo && (
                <div className={`text-xs ${t.brand.subtitleText}`}>
                  {cfg.brand.subtitulo}
                </div>
              )}
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className={`hidden md:flex items-center ${l.gapLinks}`}>
            {linksVisibles.map((x) => (
              <Link
                key={x.to}
                to={x.to}
                className={linkClass(x.to)}
                onClick={cerrarTodo}
              >
                {x.label}
              </Link>
            ))}
            

            {/* Dropdowns desktop */}
            {dropdownsVisibles.map((dd) => {
              const labelDropdown = usuario
                ? dd.labelAuth || dd.label
                : dd.labelNoAuth || dd.label;

              return (
                <div key={dd.id} className="relative">
                  <button
                    onClick={() => toggleDropdown(dd.id)}
                    aria-label={labels?.dropdownAbrir || "Abrir menú"}
                    className={`px-3 py-2 ${l.radioItem} text-sm font-semibold
                      ${t.dropdownButton.text} ${t.dropdownButton.bg || ""} ${t.dropdownButton.border || ""}
                      ${t.dropdownButton.hoverBg}`}
                  >
                    {labelDropdown} ▾
                  </button>

                  {dropdownAbierto[dd.id] && (
                    <div
                      className={`absolute right-0 mt-2 ${cfg.layout.anchoDropdown}
                        ${l.paddingDropdown} ${l.radio} ${l.sombra}
                        ${t.dropdownPanel.bg} ${t.dropdownPanel.border}`}
                    >
                      {dd.itemsVisibles.map((it) => (
                        <Link
                          key={it.to}
                          to={it.to}
                          className={`block px-3 py-2 ${l.radioItem} text-sm font-semibold
                            ${t.dropdownItem.text} ${t.dropdownItem.hoverBg}`}
                          onClick={() => {
                            cerrarDropdown(dd.id);
                            setMenuAbierto(false);
                          }}
                        >
                          {it.label}
                        </Link>
                      ))}

                      
                    </div>
                  )}
                </div>
              );
            })}
            {usuario && (
              <button
                onClick={onLogout}
                className={`px-3 py-2 ${l.radioItem} text-sm font-semibold
                  ${t.logout.text} ${t.logout.hoverBg}`}
              >
                {labels?.botonSalir || "Logout"}
              </button>
            )}
          </nav>

          {/* Hamburger */}
          <button
            className={`md:hidden px-3 py-2 ${l.radioItem} ${t.hamburger.border}
              ${t.hamburger.bg} ${t.hamburger.text} ${t.hamburger.hoverBg}`}
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label={labels?.menuAbrir || "Abrir menú"}
          >
            ☰
          </button>
        </div>

        {/* Mobile menu */}
        {menuAbierto && (
          <div className={`md:hidden mt-3 ${l.radio} p-2 ${t.mobileMenu.bg} ${t.mobileMenu.border}`}>
            {linksVisibles.map((x) => (
              <Link key={x.to} to={x.to} className={linkClass(x.to)} onClick={cerrarTodo}>
                {x.label}
              </Link>
            ))}

            {/* Dropdowns mobile */}
            {dropdownsVisibles.map((dd) => {
              const labelDropdown = usuario
                ? dd.labelAuth || dd.label
                : dd.labelNoAuth || dd.label;

              return (
                <div key={dd.id} className={`mt-2 ${t.divider} pt-2`}>
                  <div className="px-3 py-2 text-xs font-bold text-gray-900">
                    {labelDropdown.toUpperCase()}
                  </div>

                  {dd.itemsVisibles.map((it) => (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={`block px-3 py-2 ${l.radioItem} text-sm font-semibold
                        ${t.dropdownItem.text} ${t.dropdownItem.hoverBg}`}
                      onClick={cerrarTodo}
                    >
                      {it.label}
                    </Link>
                  ))}

                  {usuario && dd.id === "admin" ? (
                    <button
                      onClick={() => {
                        cerrarTodo();
                        onLogout?.();
                      }}
                      className={`w-full text-left px-3 py-2 ${l.radioItem} text-sm font-semibold
                        ${t.logout.text} ${t.logout.hoverBg}`}
                    >
                      {labels?.botonSalir || "Logout"}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
