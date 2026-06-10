-- =============================================================================
-- MIGRATION V2: Estandarización de nombres de tablas y columnas
-- =============================================================================
-- SEGURO: PostgreSQL RENAME es operación de metadata — instantánea, sin mover datos.
-- IDEMPOTENTE: el bloque DO verifica si gym_persona ya fue renombrada antes de ejecutar.
-- =============================================================================

DO $$
BEGIN
  -- Solo ejecuta si la migración aún no se aplicó (gym_persona todavía existe)
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'persona') THEN

    RAISE NOTICE 'Aplicando migration v2: renombrado de tablas y columnas...';

    -- =========================================================================
    -- TABLAS
    -- =========================================================================
    ALTER TABLE gym_persona          RENAME TO persona;
    ALTER TABLE gym_alumno           RENAME TO alumno;
    ALTER TABLE gym_cat_tipoplan     RENAME TO plan_tipo;
    ALTER TABLE gym_cat_estado_alumno RENAME TO alumno_estado;
    ALTER TABLE gym_cat_sexo         RENAME TO sexo;
    ALTER TABLE gym_cat_tipodocumento RENAME TO tipo_documento;
    ALTER TABLE gym_cat_tipopersona  RENAME TO tipo_persona;
    ALTER TABLE gym_fecha_disponible RENAME TO membresia;
    ALTER TABLE gym_dia_ingreso      RENAME TO ingreso;
    ALTER TABLE gym_log_estado_alumno RENAME TO alumno_estado_log;
    ALTER TABLE gym_usuario          RENAME TO usuario;
    ALTER TABLE gym_usuario_rol      RENAME TO usuario_rol;
    ALTER TABLE gym_rol              RENAME TO rol;

    -- =========================================================================
    -- COLUMNAS: persona
    -- =========================================================================
    ALTER TABLE persona RENAME COLUMN gym_persona_id               TO id;
    ALTER TABLE persona RENAME COLUMN gym_persona_rela_tipodocumento TO tipo_documento_id;
    ALTER TABLE persona RENAME COLUMN gym_persona_rela_sexo        TO sexo_id;
    ALTER TABLE persona RENAME COLUMN gym_persona_rela_tipopersona TO tipo_persona_id;
    ALTER TABLE persona RENAME COLUMN gym_persona_nombre           TO nombre;
    ALTER TABLE persona RENAME COLUMN gym_persona_apellido         TO apellido;
    ALTER TABLE persona RENAME COLUMN gym_persona_fechanacimiento  TO fecha_nacimiento;
    ALTER TABLE persona RENAME COLUMN gym_persona_documento        TO documento;
    ALTER TABLE persona RENAME COLUMN gym_persona_celular          TO celular;
    ALTER TABLE persona RENAME COLUMN gym_persona_celular_emergencia TO celular_emergencia;
    ALTER TABLE persona RENAME COLUMN gym_persona_email            TO email;
    ALTER TABLE persona RENAME COLUMN gym_persona_fechacambio      TO actualizado_en;

    -- =========================================================================
    -- COLUMNAS: alumno
    -- =========================================================================
    ALTER TABLE alumno RENAME COLUMN gym_alumno_id                 TO id;
    ALTER TABLE alumno RENAME COLUMN gym_alumno_rela_persona       TO persona_id;
    ALTER TABLE alumno RENAME COLUMN gym_alumno_rela_tipoplan      TO plan_tipo_id;
    ALTER TABLE alumno RENAME COLUMN gym_alumno_rela_estadoalumno  TO estado_id;
    ALTER TABLE alumno RENAME COLUMN gym_alumno_fecharegistro      TO fecha_registro;
    ALTER TABLE alumno RENAME COLUMN gym_alumno_certificadoaptfisica TO certificado_apt_fisica;
    ALTER TABLE alumno RENAME COLUMN gym_alumno_fechacambio        TO actualizado_en;

    -- =========================================================================
    -- COLUMNAS: plan_tipo
    -- =========================================================================
    ALTER TABLE plan_tipo RENAME COLUMN gym_cat_tipoplan_id          TO id;
    ALTER TABLE plan_tipo RENAME COLUMN gym_cat_tipoplan_descripcion TO descripcion;
    ALTER TABLE plan_tipo RENAME COLUMN gym_cat_tipoplan_fechacambio TO actualizado_en;
    ALTER TABLE plan_tipo RENAME COLUMN gym_cat_tipoplan_dias_totales TO dias_totales;
    ALTER TABLE plan_tipo RENAME COLUMN gym_cat_tipoplan_ingresos    TO ingresos;
    ALTER TABLE plan_tipo RENAME COLUMN gym_cat_tipoplan_precio      TO precio;
    ALTER TABLE plan_tipo RENAME COLUMN gym_cat_tipoplan_activo      TO activo;

    -- =========================================================================
    -- COLUMNAS: alumno_estado
    -- =========================================================================
    ALTER TABLE alumno_estado RENAME COLUMN gym_cat_estadoalumno_id          TO id;
    ALTER TABLE alumno_estado RENAME COLUMN gym_cat_estadoalumno_descripcion TO descripcion;
    ALTER TABLE alumno_estado RENAME COLUMN gym_cat_estadoalumno_fechacambio TO actualizado_en;

    -- =========================================================================
    -- COLUMNAS: sexo
    -- =========================================================================
    ALTER TABLE sexo RENAME COLUMN gym_cat_sexo_id          TO id;
    ALTER TABLE sexo RENAME COLUMN gym_cat_sexo_descripcion TO descripcion;
    ALTER TABLE sexo RENAME COLUMN gym_cat_sexo_fechacambio TO actualizado_en;

    -- =========================================================================
    -- COLUMNAS: tipo_documento
    -- =========================================================================
    ALTER TABLE tipo_documento RENAME COLUMN gym_cat_tipodocumento_id          TO id;
    ALTER TABLE tipo_documento RENAME COLUMN gym_cat_tipodocumento_descripcion TO descripcion;
    ALTER TABLE tipo_documento RENAME COLUMN gym_cat_tipodocumento_fechacambio TO actualizado_en;

    -- =========================================================================
    -- COLUMNAS: tipo_persona
    -- =========================================================================
    ALTER TABLE tipo_persona RENAME COLUMN gym_cat_tipopersona_id          TO id;
    ALTER TABLE tipo_persona RENAME COLUMN gym_cat_tipopersona_descripcion TO descripcion;
    ALTER TABLE tipo_persona RENAME COLUMN gym_cat_tipopersona_fechacambio TO actualizado_en;

    -- =========================================================================
    -- COLUMNAS: membresia (era gym_fecha_disponible)
    -- =========================================================================
    ALTER TABLE membresia RENAME COLUMN gym_fecha_id                   TO id;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_rela_alumno          TO alumno_id;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_montopagado          TO monto_pagado;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_inicio               TO fecha_inicio;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_fin                  TO fecha_fin;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_diasingreso          TO dias_totales;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_ingresosdisponibles  TO ingresos_disponibles;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_metodopago           TO metodo_pago;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_fechacambio          TO actualizado_en;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_rela_tipoplan        TO plan_tipo_id;
    ALTER TABLE membresia RENAME COLUMN gym_fecha_rela_usuario_cobro   TO cobrado_por_id;

    -- =========================================================================
    -- COLUMNAS: ingreso (era gym_dia_ingreso)
    -- =========================================================================
    ALTER TABLE ingreso RENAME COLUMN gym_dia_id          TO id;
    ALTER TABLE ingreso RENAME COLUMN gym_dia_rela_fecha  TO membresia_id;
    ALTER TABLE ingreso RENAME COLUMN gym_dia_fechaingreso TO fecha_ingreso;
    ALTER TABLE ingreso RENAME COLUMN gym_dia_horaingreso  TO hora_ingreso;
    ALTER TABLE ingreso RENAME COLUMN gym_dia_fechacambio  TO creado_en;

    -- =========================================================================
    -- COLUMNAS: alumno_estado_log (era gym_log_estado_alumno)
    -- =========================================================================
    -- id puede o no existir — renombrar solo si existe
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'alumno_estado_log' AND column_name = 'gym_log_estadoalumno_id'
    ) THEN
      ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_id TO id;
    END IF;

    ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_rela_alumno    TO alumno_id;
    ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_estado_anterior TO estado_anterior_id;
    ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_estado_nuevo   TO estado_nuevo_id;
    ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_fechacambio    TO creado_en;
    ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_motivo         TO motivo;
    ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_fuente         TO fuente;
    ALTER TABLE alumno_estado_log RENAME COLUMN gym_log_estadoalumno_modificado_por TO modificado_por;

    -- =========================================================================
    -- COLUMNAS: usuario
    -- =========================================================================
    ALTER TABLE usuario RENAME COLUMN gym_usuario_id           TO id;
    ALTER TABLE usuario RENAME COLUMN gym_usuario_rela_persona TO persona_id;
    ALTER TABLE usuario RENAME COLUMN gym_usuario_contrasena   TO contrasena;
    ALTER TABLE usuario RENAME COLUMN gym_usuario_fechacambio  TO actualizado_en;
    ALTER TABLE usuario RENAME COLUMN gym_usuario_activo       TO activo;
    ALTER TABLE usuario RENAME COLUMN gym_usuario_ultimo_login TO ultimo_login;

    -- =========================================================================
    -- COLUMNAS: usuario_rol
    -- =========================================================================
    ALTER TABLE usuario_rol RENAME COLUMN gym_usuario_rol_id            TO id;
    ALTER TABLE usuario_rol RENAME COLUMN gym_usuario_rol_rela_usuario  TO usuario_id;
    ALTER TABLE usuario_rol RENAME COLUMN gym_usuario_rol_rela_rol      TO rol_id;
    ALTER TABLE usuario_rol RENAME COLUMN gym_usuario_rol_fechacambio   TO actualizado_en;

    -- =========================================================================
    -- COLUMNAS: rol
    -- =========================================================================
    ALTER TABLE rol RENAME COLUMN gym_rol_id          TO id;
    ALTER TABLE rol RENAME COLUMN gym_rol_codigo      TO codigo;
    ALTER TABLE rol RENAME COLUMN gym_rol_descripcion TO descripcion;
    ALTER TABLE rol RENAME COLUMN gym_rol_fechacambio TO actualizado_en;

    RAISE NOTICE 'Migration v2 aplicada exitosamente.';

  ELSE
    RAISE NOTICE 'Migration v2 ya fue aplicada — omitiendo.';
  END IF;
END $$;
