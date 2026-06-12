import { useEffect, useState } from "react";
import { getCatalogos } from "../api/catalogos_api.js";

export function useCatalogos() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const r = await getCatalogos();
        if (!alive) return;
        setData(r);
      } catch (e) {
        if (!alive) return;
        setError(e);
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
}
