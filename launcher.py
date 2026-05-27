# ─────────────────────────────────────────────────────────────────
#  Dynamic Gym — Launcher de producción
#  Solo levanta el backend Node.js (el frontend ya está en dist/)
#
#  PyInstaller (ejecutar build_launcher.py):
#    python build_launcher.py
# ─────────────────────────────────────────────────────────────────

import tkinter as tk
from tkinter import scrolledtext, font as tk_font
import subprocess
import threading
import webbrowser
import os
import sys
import time
import socket

# ── rutas ────────────────────────────────────────────────────────
BASE_DIR      = os.path.dirname(sys.executable) if getattr(sys, "frozen", False) \
                else os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR   = os.path.join(BASE_DIR, "servidor")
FRONTEND_DIR  = os.path.join(BASE_DIR, "frontend")
PORT          = 3001

# ── colores Dynamic Gym ───────────────────────────────────────────
BG      = "#131f33"
PANEL   = "#1b2b44"
ACCENT  = "#2563eb"
BORDER  = "#2d3f5c"
GREEN   = "#22c55e"
RED     = "#ef4444"
YELLOW  = "#eab308"
CYAN    = "#22d3ee"
ORANGE  = "#f97316"
TEXT    = "#f8fafc"
MUTED   = "#8ba0bc"
LOG_BG  = "#0d1828"
PURPLE  = "#a78bfa"


# ═════════════════════════════════════════════════════════════════
class DynamicGymLauncher(tk.Tk):

    def __init__(self):
        super().__init__()
        self.title("Dynamic Gym")
        self.geometry("720x570")
        self.resizable(False, False)
        self.configure(bg=BG)

        self.backend_proc  = None
        self._running      = True
        self._installing   = False

        self._try_set_icon()
        self._build_ui()
        self.protocol("WM_DELETE_WINDOW", self._on_close)

    # ── icono de ventana ─────────────────────────────────────────
    def _try_set_icon(self):
        ico = os.path.join(BASE_DIR, "dynamic_gym.ico")
        if os.path.isfile(ico):
            try:
                self.iconbitmap(ico)
            except Exception:
                pass

    # ── interfaz ─────────────────────────────────────────────────
    def _build_ui(self):
        # franja superior
        tk.Frame(self, bg=ACCENT, height=3).pack(fill="x")

        # encabezado
        hdr = tk.Frame(self, bg=BG, pady=12)
        hdr.pack(fill="x", padx=24)
        tk.Label(hdr, text="DYNAMIC", bg=BG, fg=TEXT,
                 font=("Segoe UI", 20, "bold")).pack(side="left")
        tk.Label(hdr, text=" GYM", bg=BG, fg=ACCENT,
                 font=("Segoe UI", 20, "bold")).pack(side="left")
        tk.Label(hdr, text="   Sistema de Gestión", bg=BG, fg=MUTED,
                 font=("Segoe UI", 10)).pack(side="left", pady=5)

        # ── cards de estado ──────────────────────────────────────
        cards_row = tk.Frame(self, bg=BG, padx=24)
        cards_row.pack(fill="x")
        self.pg_dot, pg_card = self._card(cards_row, "Base de datos", "Render · Cloud")
        self.be_dot, be_card = self._card(cards_row, "Servidor",      "localhost:3001")
        pg_card.pack(side="left", padx=(0, 12))
        be_card.pack(side="left")

        # ── fila 1 de botones: sistema ───────────────────────────
        btn_row1 = tk.Frame(self, bg=BG, pady=10)
        btn_row1.pack(fill="x", padx=24)

        self.btn_start = self._btn(btn_row1, "▶  Iniciar", self._start, ACCENT)
        self.btn_start.pack(side="left", padx=(0, 8))

        self.btn_stop = self._btn(btn_row1, "■  Detener", self._stop, RED)
        self.btn_stop.pack(side="left", padx=(0, 8))
        self.btn_stop.configure(state="disabled")

        self.btn_browser = self._btn(btn_row1, "🖥  Local", self._open_browser, CYAN)
        self.btn_browser.pack(side="left", padx=(0, 8))
        self.btn_browser.configure(state="disabled")

        self.btn_vercel = self._btn(btn_row1, "🌐  Vercel", self._open_vercel, PURPLE)
        self.btn_vercel.pack(side="left")


        # ── fila 2 de botones: herramientas ──────────────────────
        btn_row2 = tk.Frame(self, bg=BG, pady=0)
        btn_row2.pack(fill="x", padx=24)

        tk.Label(btn_row2, text="Herramientas:", bg=BG, fg=MUTED,
                 font=("Segoe UI", 8)).pack(side="left", padx=(0, 8))

        self.btn_install_be = self._btn_sm(
            btn_row2, "📦  npm install servidor",
            lambda: self._run_npm_install("servidor"),
            ORANGE,
        )
        self.btn_install_be.pack(side="left", padx=(0, 6))

        self.btn_install_fe = self._btn_sm(
            btn_row2, "📦  npm install frontend",
            lambda: self._run_npm_install("frontend"),
            ORANGE,
        )
        self.btn_install_fe.pack(side="left", padx=(0, 6))

        self.btn_build_fe = self._btn_sm(
            btn_row2, "🛠  npm run build frontend",
            self._run_npm_build,
            CYAN,
        )
        self.btn_build_fe.pack(side="left")

        # ── fila 3 de botones: audit fix ─────────────────────────
        btn_row3 = tk.Frame(self, bg=BG, pady=4)
        btn_row3.pack(fill="x", padx=24)

        tk.Label(btn_row3, text="Audit fix:", bg=BG, fg=MUTED,
                 font=("Segoe UI", 8)).pack(side="left", padx=(0, 8))

        self.btn_audit_be = self._btn_sm(
            btn_row3, "🔧  npm audit fix servidor",
            lambda: self._run_npm_audit_fix("servidor"),
            GREEN,
        )
        self.btn_audit_be.pack(side="left", padx=(0, 6))

        self.btn_audit_fe = self._btn_sm(
            btn_row3, "🔧  npm audit fix frontend",
            lambda: self._run_npm_audit_fix("frontend"),
            GREEN,
        )
        self.btn_audit_fe.pack(side="left")

        # ── consola ──────────────────────────────────────────────
        tk.Frame(self, bg=BORDER, height=1).pack(fill="x", padx=24, pady=(8, 4))

        tk.Label(self, text="Consola", bg=BG, fg=MUTED,
                 font=("Segoe UI", 9)).pack(anchor="w", padx=26)

        mono = ("Cascadia Code", 9) if "Cascadia Code" in tk_font.families() \
               else ("Consolas", 9)

        self.log = scrolledtext.ScrolledText(
            self, bg=LOG_BG, fg=TEXT, font=mono,
            bd=0, relief="flat", height=13,
            state="disabled", insertbackground=TEXT,
        )
        self.log.pack(fill="both", expand=True, padx=24, pady=(2, 18))

        self.log.tag_config("info",   foreground=TEXT)
        self.log.tag_config("ok",     foreground=GREEN)
        self.log.tag_config("error",  foreground=RED)
        self.log.tag_config("warn",   foreground=YELLOW)
        self.log.tag_config("srv",    foreground=PURPLE)
        self.log.tag_config("muted",  foreground=MUTED)
        self.log.tag_config("link",   foreground=CYAN)
        self.log.tag_config("install",foreground=ORANGE)

        self._log("Dynamic Gym Launcher listo.", "muted")
        self._check_node_modules()
        self._check_env_file()

    # ── widgets ──────────────────────────────────────────────────
    def _card(self, parent, label, port_label):
        card = tk.Frame(parent, bg=PANEL, padx=18, pady=12,
                        highlightbackground=BORDER, highlightthickness=1)
        dot = tk.Label(card, text="●", fg=RED, bg=PANEL, font=("Segoe UI", 16))
        dot.pack(side="left", padx=(0, 10))
        info = tk.Frame(card, bg=PANEL)
        info.pack(side="left")
        tk.Label(info, text=label,      bg=PANEL, fg=TEXT,  font=("Segoe UI", 11, "bold")).pack(anchor="w")
        tk.Label(info, text=port_label, bg=PANEL, fg=MUTED, font=("Segoe UI", 8)).pack(anchor="w")
        return dot, card

    def _btn(self, parent, text, cmd, color):
        return tk.Button(
            parent, text=text, command=cmd,
            bg=color, fg="white", activebackground=color, activeforeground="white",
            relief="flat", bd=0, padx=16, pady=8,
            cursor="hand2", font=("Segoe UI", 10, "bold"),
        )

    def _btn_sm(self, parent, text, cmd, color):
        return tk.Button(
            parent, text=text, command=cmd,
            bg=PANEL, fg=color, activebackground=PANEL, activeforeground=color,
            relief="flat", bd=1, padx=10, pady=4,
            highlightbackground=color, highlightthickness=1,
            cursor="hand2", font=("Segoe UI", 8, "bold"),
        )

    # ── log ──────────────────────────────────────────────────────
    def _log(self, msg, tag="info"):
        def _w():
            self.log.configure(state="normal")
            ts = time.strftime("%H:%M:%S")
            self.log.insert("end", f"[{ts}] {msg}\n", tag)
            self.log.see("end")
            self.log.configure(state="disabled")
        self.after(0, _w)

    def _dot(self, dot, color):
        self.after(0, lambda: dot.configure(fg=color))

    # ── verificación inicial de node_modules ─────────────────────
    def _check_node_modules(self):
        nm = os.path.join(BACKEND_DIR, "node_modules")
        if not os.path.isdir(nm):
            self._log("⚠  node_modules del servidor no encontrado.", "warn")
            self._log("   Presioná  📦 npm install servidor  antes de iniciar.", "warn")

    def _check_env_file(self):
        env_path = os.path.join(BACKEND_DIR, ".env")
        if not os.path.isfile(env_path):
            self._log("⚠  No se encontró servidor/.env.", "warn")
            self._log("   El archivo .env es obligatorio para configurar la API.", "warn")

    # ── acciones sistema ─────────────────────────────────────────
    def _start(self):
        self.btn_start.configure(state="disabled")
        threading.Thread(target=self._start_all, daemon=True).start()

    def _start_all(self):
        self._log("Verificando PostgreSQL...", "info")
        if self._check_postgres():
            self._dot(self.pg_dot, GREEN)
            self._log("PostgreSQL OK ✓", "ok")
        else:
            self._dot(self.pg_dot, YELLOW)
            self._log("PostgreSQL no detectado — verificá que esté corriendo.", "warn")

        self._log("Iniciando servidor Node.js...", "srv")
        self._start_backend()

        time.sleep(5)
        self.after(0, lambda: self.btn_stop.configure(state="normal"))
        self.after(0, lambda: self.btn_browser.configure(state="normal"))

        self._log(f"App local  →  http://localhost:{PORT}", "link")
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
                s.connect(("8.8.8.8", 80))
                ip = s.getsockname()[0]
            self._log(f"App en red →  http://{ip}:{PORT}", "link")
        except Exception:
            pass

    def _stop(self):
        self.btn_stop.configure(state="disabled")
        self.btn_browser.configure(state="disabled")
        threading.Thread(target=self._stop_all, daemon=True).start()

    def _stop_all(self):
        self._log("Deteniendo servidor...", "warn")
        self._kill(self.backend_proc, "Servidor")
        self.backend_proc = None
        self._dot(self.be_dot, RED)
        self._log("Servidor detenido.", "warn")
        self.after(0, lambda: self.btn_start.configure(state="normal"))

    def _open_browser(self):
        webbrowser.open(f"http://localhost:{PORT}")

    def _open_vercel(self):
        webbrowser.open("https://dynamic-gym.vercel.app")

    # ── npm install ──────────────────────────────────────────────
    def _run_npm_install(self, target):
        if self._installing:
            self._log("Ya hay una instalación en curso, esperá...", "warn")
            return

        target_dir = BACKEND_DIR if target == "servidor" else FRONTEND_DIR
        if not os.path.isdir(target_dir):
            self._log(f"Carpeta no encontrada: {target_dir}", "error")
            return

        self._installing = True
        self._set_all_tool_btns("disabled")

        def _do_install():
            self._log(f"Instalando dependencias en {target}...", "install")
            install_ok = False
            vuln_count = 0  # cantidad de vulnerabilidades detectadas

            # Palabras que indican líneas de ruido a suprimir del log
            _SKIP = (
                "looking for funding",
                "run `npm fund",
                "npm fund",
                "to address all issues",
                "npm audit fix",
                "run `npm audit",
                "run npm audit",
            )

            try:
                proc = subprocess.Popen(
                    [self._npm(), "install"],
                    cwd=target_dir,
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                    text=True, bufsize=1, encoding="utf-8", errors="replace",
                )
                for line in proc.stdout:
                    line  = line.rstrip()
                    if not line:
                        continue
                    lower = line.lower()

                    # Suprimir líneas de funding y audit que son solo ruido
                    if any(kw in lower for kw in _SKIP):
                        continue

                    # Detectar y suprimir línea de vulnerabilidades (guardar el count)
                    if "vulnerabilit" in lower:
                        import re
                        m = re.search(r"(\d+)\s+vulnerabilit", lower)
                        if m:
                            vuln_count = int(m.group(1))
                        continue  # suprimir la línea, mostraremos resumen al final

                    # Línea de éxito de install
                    if any(kw in lower for kw in ("added", "up to date", "audited")):
                        self._log(line, "ok")
                        install_ok = True
                    else:
                        self._log(line, "install")

                proc.wait()

                if proc.returncode == 0 or install_ok:
                    self._log(f"✓ npm install {target} completado.", "ok")
                    if vuln_count:
                        self._log(
                            f"⚠  {vuln_count} vulnerabilidad(es) en dependencias "
                            "(no afectan el funcionamiento). Ejecutá 'npm audit fix' si querés resolverlas.",
                            "warn",
                        )
                else:
                    self._log(f"npm install {target} terminó con error (código {proc.returncode}).", "error")
            except Exception as e:
                self._log(f"Error en npm install {target}: {e}", "error")
            finally:
                self._installing = False
                self.after(0, lambda: self._set_all_tool_btns("normal"))

        threading.Thread(target=_do_install, daemon=True).start()

    def _run_npm_build(self):
        if self._installing:
            self._log("Ya hay una operación en curso, esperá...", "warn")
            return

        if not os.path.isdir(FRONTEND_DIR):
            self._log(f"Carpeta no encontrada: {FRONTEND_DIR}", "error")
            return

        self._installing = True
        self._set_all_tool_btns("disabled")

        def _do_build():
            self._log("Construyendo frontend (npm run build)...", "install")
            try:
                proc = subprocess.Popen(
                    [self._npm(), "run", "build"],
                    cwd=FRONTEND_DIR,
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                    text=True, bufsize=1, encoding="utf-8", errors="replace",
                )
                for line in proc.stdout:
                    line = line.rstrip()
                    if line:
                        self._log(line, "install")
                proc.wait()
                if proc.returncode == 0:
                    self._log("✓ npm run build frontend completado.", "ok")
                else:
                    self._log(f"npm run build frontend terminó con error (código {proc.returncode}).", "error")
            except Exception as e:
                self._log(f"Error en npm run build frontend: {e}", "error")
            finally:
                self._installing = False
                self.after(0, lambda: self._set_all_tool_btns("normal"))

        threading.Thread(target=_do_build, daemon=True).start()

    def _run_npm_audit_fix(self, target):
        if self._installing:
            self._log("Ya hay una operación en curso, esperá...", "warn")
            return

        target_dir = BACKEND_DIR if target == "servidor" else FRONTEND_DIR
        if not os.path.isdir(target_dir):
            self._log(f"Carpeta no encontrada: {target_dir}", "error")
            return

        self._installing = True
        self._set_all_tool_btns("disabled")

        def _do_audit_fix():
            self._log(f"Ejecutando npm audit fix en {target}...", "install")
            try:
                proc = subprocess.Popen(
                    [self._npm(), "audit", "fix"],
                    cwd=target_dir,
                    stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                    creationflags=subprocess.CREATE_NO_WINDOW,
                    text=True, bufsize=1, encoding="utf-8", errors="replace",
                )
                vuln_after = None
                for line in proc.stdout:
                    line  = line.rstrip()
                    if not line:
                        continue
                    lower = line.lower()
                    # Suprimir ruido de funding
                    if any(kw in lower for kw in (
                        "looking for funding", "run `npm fund", "npm fund",
                    )):
                        continue
                    # Capturar resumen de vulnerabilidades restantes
                    if "vulnerabilit" in lower:
                        import re
                        m = re.search(r"(\d+)\s+vulnerabilit", lower)
                        vuln_after = int(m.group(1)) if m else None
                        continue
                    # Suprimir líneas de "to address" y "npm audit"
                    if any(kw in lower for kw in ("to address", "run `npm audit", "run npm audit")):
                        continue
                    if any(kw in lower for kw in ("added", "removed", "changed", "up to date", "audited", "fixed")):
                        self._log(line, "ok")
                    else:
                        self._log(line, "install")
                proc.wait()
                if proc.returncode == 0:
                    self._log(f"✓ npm audit fix {target} completado.", "ok")
                    if vuln_after and vuln_after > 0:
                        self._log(
                            f"⚠  Quedan {vuln_after} vulnerabilidad(es) que requieren cambios manuales "
                            "(breaking changes). Revisá con 'npm audit'.",
                            "warn",
                        )
                    else:
                        self._log("✓ Sin vulnerabilidades pendientes.", "ok")
                else:
                    self._log(f"npm audit fix {target} terminó con advertencias (código {proc.returncode}).", "warn")
                    if vuln_after:
                        self._log(
                            f"⚠  {vuln_after} vulnerabilidad(es) requieren '--force' o corrección manual.",
                            "warn",
                        )
            except Exception as e:
                self._log(f"Error en npm audit fix {target}: {e}", "error")
            finally:
                self._installing = False
                self.after(0, lambda: self._set_all_tool_btns("normal"))

        threading.Thread(target=_do_audit_fix, daemon=True).start()

    def _set_all_tool_btns(self, state):
        for btn in (
            self.btn_install_be, self.btn_install_fe,
            self.btn_build_fe, self.btn_audit_be, self.btn_audit_fe,
        ):
            self.after(0, lambda b=btn: b.configure(state=state))

    # ── procesos ─────────────────────────────────────────────────
    def _npm(self):
        return "npm.cmd"

    def _start_backend(self):
        try:
            self.backend_proc = subprocess.Popen(
                [self._npm(), "start"],
                cwd=BACKEND_DIR,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                creationflags=subprocess.CREATE_NO_WINDOW,
                text=True, bufsize=1, encoding="utf-8", errors="replace",
            )
            self._dot(self.be_dot, YELLOW)
            threading.Thread(
                target=self._read_output,
                args=(self.backend_proc, self.be_dot),
                daemon=True,
            ).start()
        except Exception as e:
            self._log(f"Error al iniciar servidor: {e}", "error")
            self.after(0, lambda: self.btn_start.configure(state="normal"))

    def _read_output(self, proc, dot):
        READY = ["✅ API local", "✅ Base de datos conectada", "✅ Servidor corriendo",
                 "listening", "started", "API local:"]
        for line in proc.stdout:
            line = line.rstrip()
            if not line:
                continue
            self._log(line, "srv")
            if any(kw in line for kw in READY):
                self._dot(dot, GREEN)

    def _kill(self, proc, name):
        if proc and proc.poll() is None:
            try:
                subprocess.call(
                    ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                    creationflags=subprocess.CREATE_NO_WINDOW,
                )
                self._log(f"{name} detenido.", "warn")
            except Exception as e:
                self._log(f"Error al detener {name}: {e}", "error")

    def _get_db_host_port(self):
        """Lee DATABASE_URL del .env y devuelve (host, port)."""
        import re
        env_path = os.path.join(BACKEND_DIR, ".env")
        try:
            with open(env_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("DATABASE_URL="):
                        url = line[len("DATABASE_URL="):].strip()
                        m = re.search(r"@([^:/\s]+):?(\d+)?/", url)
                        if m:
                            host = m.group(1)
                            port = int(m.group(2)) if m.group(2) else 5432
                            return host, port
        except Exception:
            pass
        return "localhost", 5432

    def _check_postgres(self):
        """Verifica conectividad TCP al host de la DB (local o Render)."""
        try:
            host, port = self._get_db_host_port()
            label = f"{host}:{port}"
            self._log(f"Verificando DB en {label} ...", "info")
            with socket.create_connection((host, port), timeout=8):
                return True
        except Exception:
            return False

    def _on_close(self):
        self._running = False
        self._stop_all()
        self.destroy()


# ═════════════════════════════════════════════════════════════════
if __name__ == "__main__":
    app = DynamicGymLauncher()
    app.mainloop()
