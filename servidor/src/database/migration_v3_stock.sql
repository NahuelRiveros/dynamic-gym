-- =============================================================================
-- MIGRATION V3: Módulo de stock (mercadería: agua, bebidas, suplementos, etc.)
-- =============================================================================
-- IDEMPOTENTE: usa IF NOT EXISTS / DROP TRIGGER IF EXISTS en todas partes.
-- Se ejecuta en cada arranque junto al resto de migraciones (ver migration_runner.js).
-- =============================================================================

CREATE TABLE IF NOT EXISTS gym_v3.producto (
  id             SERIAL        PRIMARY KEY,
  nombre         VARCHAR(120)  NOT NULL,
  categoria      VARCHAR(60),
  precio_venta   DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (precio_venta >= 0),
  stock_actual   INT           NOT NULL DEFAULT 0 CHECK (stock_actual >= 0),
  stock_minimo   INT           NOT NULL DEFAULT 0 CHECK (stock_minimo >= 0),
  activo         BOOLEAN       NOT NULL DEFAULT TRUE,
  creado_en      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gym_v3.movimiento_stock (
  id                SERIAL        PRIMARY KEY,
  producto_id       INT           NOT NULL REFERENCES gym_v3.producto(id),
  tipo              VARCHAR(20)   NOT NULL CHECK (tipo IN ('entrada', 'venta', 'baja')),
  motivo            VARCHAR(150),
  cantidad          INT           NOT NULL CHECK (cantidad > 0),
  precio_unitario   DECIMAL(10,2),
  metodo_pago       VARCHAR(30),
  registrado_por_id INT           NOT NULL REFERENCES gym_v3.usuario(id),
  creado_en         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_movimiento_baja_motivo
    CHECK (tipo <> 'baja' OR motivo IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_v3_producto_activo             ON gym_v3.producto(activo);
CREATE INDEX IF NOT EXISTS idx_v3_movimiento_stock_producto_id ON gym_v3.movimiento_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_v3_movimiento_stock_tipo         ON gym_v3.movimiento_stock(tipo);
CREATE INDEX IF NOT EXISTS idx_v3_movimiento_stock_creado_en    ON gym_v3.movimiento_stock(creado_en);

-- Reutiliza la función de trigger ya creada en setup_gym_v3.sql
DROP TRIGGER IF EXISTS trg_actualizado_en_producto ON gym_v3.producto;
CREATE TRIGGER trg_actualizado_en_producto
  BEFORE UPDATE ON gym_v3.producto
  FOR EACH ROW EXECUTE FUNCTION gym_v3.fn_set_actualizado_en();
