-- =============================================================================
-- MIGRATION V4: Normalizar categoría de producto (catálogo en vez de texto libre)
-- =============================================================================
-- IDEMPOTENTE.
-- =============================================================================

CREATE TABLE IF NOT EXISTS gym_v3.categoria_producto (
  id          SERIAL      PRIMARY KEY,
  descripcion VARCHAR(60) NOT NULL UNIQUE,
  activo      BOOLEAN     NOT NULL DEFAULT TRUE,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO gym_v3.categoria_producto (descripcion) VALUES
  ('Bebidas'),
  ('Suplementos'),
  ('Snacks'),
  ('Accesorios'),
  ('Otros')
ON CONFLICT (descripcion) DO NOTHING;

ALTER TABLE gym_v3.producto
  ADD COLUMN IF NOT EXISTS categoria_id INT REFERENCES gym_v3.categoria_producto(id);

-- Migra el texto libre existente a la categoría con igual descripción (best-effort)
-- y elimina la columna vieja. Solo corre si "categoria" todavía existe (idempotente).
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'gym_v3' AND table_name = 'producto' AND column_name = 'categoria'
  ) THEN
    UPDATE gym_v3.producto p
    SET categoria_id = cp.id
    FROM gym_v3.categoria_producto cp
    WHERE p.categoria_id IS NULL AND lower(trim(p.categoria)) = lower(cp.descripcion);

    ALTER TABLE gym_v3.producto DROP COLUMN categoria;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_v3_producto_categoria_id ON gym_v3.producto(categoria_id);
