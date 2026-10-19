import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useMenuAchicado } from "./use_menu_achicado.js";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("useMenuAchicado", () => {
  it("arranca con lo guardado y al alternar lo recuerda", () => {
    localStorage.setItem("dg_menu_achicado", "1");
    const { result } = renderHook(() => useMenuAchicado());
    expect(result.current[0]).toBe(true);

    act(() => result.current[1]());

    expect(result.current[0]).toBe(false);
    expect(localStorage.getItem("dg_menu_achicado")).toBe("0");
  });

  it("sin almacenamiento (modo privado) arranca grande y se puede achicar igual", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    const { result } = renderHook(() => useMenuAchicado());
    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());

    expect(result.current[0]).toBe(true);
  });
});
