-- =============================================================================
-- SOLO PARA TESTS: estructura (sin datos) de lo que existe en producción y no está
-- en src/database/*.sql: el esquema viejo "public" (lo leen estadísticas, la suscripción
-- del software y la vista de recaudación) y la vista gym_v3.vista_recaudacion_completa.
-- Sacado con pg_dump --schema-only de la copia local. NO se ejecuta nunca contra Neon:
-- lo usa servidor/tests/armar_base.js para que la base de test sea igual a la real.
-- =============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--



SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: alumno; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumno (
    id integer NOT NULL,
    persona_id integer,
    plan_tipo_id integer,
    estado_id integer,
    fecha_registro date,
    certificado_apt_fisica text,
    actualizado_en timestamp with time zone DEFAULT now()
);


--
-- Name: membresia; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.membresia (
    id integer NOT NULL,
    alumno_id integer,
    monto_pagado numeric(12,2),
    fecha_inicio date,
    fecha_fin date,
    dias_totales integer,
    ingresos_disponibles integer,
    metodo_pago text,
    actualizado_en timestamp with time zone DEFAULT now(),
    plan_tipo_id integer,
    cobrado_por_id integer
);


--
-- Name: persona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.persona (
    id integer NOT NULL,
    tipo_documento_id integer,
    sexo_id integer,
    tipo_persona_id integer,
    nombre text,
    apellido text,
    fecha_nacimiento date,
    documento bigint,
    celular bigint,
    celular_emergencia bigint,
    email text,
    actualizado_en timestamp with time zone DEFAULT now()
);


--
-- Name: plan_tipo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.plan_tipo (
    id integer NOT NULL,
    descripcion text,
    actualizado_en timestamp without time zone DEFAULT now(),
    dias_totales integer DEFAULT 0,
    ingresos integer,
    precio numeric(12,2) DEFAULT 0 NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: alumno_estado; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumno_estado (
    id integer NOT NULL,
    descripcion text,
    actualizado_en timestamp without time zone DEFAULT now()
);


--
-- Name: alumno_estado_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alumno_estado_log (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    estado_anterior_id integer NOT NULL,
    estado_nuevo_id integer NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    motivo text,
    fuente text,
    modificado_por text
);


--
-- Name: alumno_idalumno_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alumno_idalumno_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alumno_idalumno_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alumno_idalumno_seq OWNED BY public.alumno.id;


--
-- Name: ingreso; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ingreso (
    id integer NOT NULL,
    membresia_id integer,
    fecha_ingreso date,
    creado_en time without time zone DEFAULT now(),
    hora_ingreso time without time zone DEFAULT now() NOT NULL
);


--
-- Name: diaingreso_iddiaingreso_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.diaingreso_iddiaingreso_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: diaingreso_iddiaingreso_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.diaingreso_iddiaingreso_seq OWNED BY public.ingreso.id;


--
-- Name: estadoalumno_idestadoalumno_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.estadoalumno_idestadoalumno_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: estadoalumno_idestadoalumno_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.estadoalumno_idestadoalumno_seq OWNED BY public.alumno_estado.id;


--
-- Name: fechadisponible_idfecha_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fechadisponible_idfecha_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fechadisponible_idfecha_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fechadisponible_idfecha_seq OWNED BY public.membresia.id;


--
-- Name: gym_log_estado_alumno_gym_log_estadoalumno_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gym_log_estado_alumno_gym_log_estadoalumno_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gym_log_estado_alumno_gym_log_estadoalumno_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gym_log_estado_alumno_gym_log_estadoalumno_id_seq OWNED BY public.alumno_estado_log.id;


--
-- Name: rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rol (
    id integer NOT NULL,
    codigo text NOT NULL,
    descripcion text,
    actualizado_en timestamp without time zone DEFAULT now()
);


--
-- Name: gym_rol_gym_rol_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gym_rol_gym_rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gym_rol_gym_rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gym_rol_gym_rol_id_seq OWNED BY public.rol.id;


--
-- Name: usuario_rol; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario_rol (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    rol_id integer NOT NULL,
    actualizado_en timestamp without time zone DEFAULT now()
);


--
-- Name: gym_usuario_rol_gym_usuario_rol_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gym_usuario_rol_gym_usuario_rol_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gym_usuario_rol_gym_usuario_rol_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gym_usuario_rol_gym_usuario_rol_id_seq OWNED BY public.usuario_rol.id;


--
-- Name: persona_idpersona_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.persona_idpersona_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: persona_idpersona_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.persona_idpersona_seq OWNED BY public.persona.id;


--
-- Name: sexo; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sexo (
    id integer NOT NULL,
    descripcion text,
    actualizado_en timestamp without time zone DEFAULT now()
);


--
-- Name: sexopersona_idsexo_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sexopersona_idsexo_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sexopersona_idsexo_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sexopersona_idsexo_seq OWNED BY public.sexo.id;


--
-- Name: software_pago; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.software_pago (
    id integer NOT NULL,
    mp_payment_id character varying(100),
    mp_preference_id character varying(300),
    monto numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    detalle jsonb,
    periodo_desde date,
    periodo_hasta date,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: software_pago_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.software_pago_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: software_pago_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.software_pago_id_seq OWNED BY public.software_pago.id;


--
-- Name: software_suscripcion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.software_suscripcion (
    id integer NOT NULL,
    cliente_nombre character varying(200) DEFAULT 'Gym'::character varying NOT NULL,
    plan_nombre character varying(100) DEFAULT 'Plan Mensual'::character varying NOT NULL,
    precio numeric(10,2) DEFAULT 0 NOT NULL,
    fecha_inicio date NOT NULL,
    fecha_vencimiento date NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    actualizado_en timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: software_suscripcion_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.software_suscripcion_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: software_suscripcion_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.software_suscripcion_id_seq OWNED BY public.software_suscripcion.id;


--
-- Name: tipo_documento; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_documento (
    id integer NOT NULL,
    descripcion text,
    actualizado_en timestamp without time zone DEFAULT now()
);


--
-- Name: tipo_persona; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tipo_persona (
    id integer NOT NULL,
    descripcion text,
    actualizado_en timestamp without time zone DEFAULT now()
);


--
-- Name: tipodocumento_idtipodocumento_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipodocumento_idtipodocumento_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipodocumento_idtipodocumento_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipodocumento_idtipodocumento_seq OWNED BY public.tipo_documento.id;


--
-- Name: tipopersona_idtipopersona_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipopersona_idtipopersona_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipopersona_idtipopersona_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipopersona_idtipopersona_seq OWNED BY public.tipo_persona.id;


--
-- Name: tipoplan_idtipoplan_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tipoplan_idtipoplan_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tipoplan_idtipoplan_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tipoplan_idtipoplan_seq OWNED BY public.plan_tipo.id;


--
-- Name: usuario; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuario (
    id integer NOT NULL,
    persona_id integer,
    contrasena text,
    actualizado_en timestamp with time zone DEFAULT now(),
    activo boolean DEFAULT true NOT NULL,
    ultimo_login timestamp with time zone
);


--
-- Name: usuario_idusuario_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuario_idusuario_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuario_idusuario_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuario_idusuario_seq OWNED BY public.usuario.id;


--
-- Name: alumno id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno ALTER COLUMN id SET DEFAULT nextval('public.alumno_idalumno_seq'::regclass);


--
-- Name: alumno_estado id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_estado ALTER COLUMN id SET DEFAULT nextval('public.estadoalumno_idestadoalumno_seq'::regclass);


--
-- Name: alumno_estado_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_estado_log ALTER COLUMN id SET DEFAULT nextval('public.gym_log_estado_alumno_gym_log_estadoalumno_id_seq'::regclass);


--
-- Name: ingreso id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingreso ALTER COLUMN id SET DEFAULT nextval('public.diaingreso_iddiaingreso_seq'::regclass);


--
-- Name: membresia id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia ALTER COLUMN id SET DEFAULT nextval('public.fechadisponible_idfecha_seq'::regclass);


--
-- Name: persona id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona ALTER COLUMN id SET DEFAULT nextval('public.persona_idpersona_seq'::regclass);


--
-- Name: plan_tipo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_tipo ALTER COLUMN id SET DEFAULT nextval('public.tipoplan_idtipoplan_seq'::regclass);


--
-- Name: rol id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol ALTER COLUMN id SET DEFAULT nextval('public.gym_rol_gym_rol_id_seq'::regclass);


--
-- Name: sexo id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sexo ALTER COLUMN id SET DEFAULT nextval('public.sexopersona_idsexo_seq'::regclass);


--
-- Name: software_pago id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.software_pago ALTER COLUMN id SET DEFAULT nextval('public.software_pago_id_seq'::regclass);


--
-- Name: software_suscripcion id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.software_suscripcion ALTER COLUMN id SET DEFAULT nextval('public.software_suscripcion_id_seq'::regclass);


--
-- Name: tipo_documento id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documento ALTER COLUMN id SET DEFAULT nextval('public.tipodocumento_idtipodocumento_seq'::regclass);


--
-- Name: tipo_persona id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_persona ALTER COLUMN id SET DEFAULT nextval('public.tipopersona_idtipopersona_seq'::regclass);


--
-- Name: usuario id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario ALTER COLUMN id SET DEFAULT nextval('public.usuario_idusuario_seq'::regclass);


--
-- Name: usuario_rol id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol ALTER COLUMN id SET DEFAULT nextval('public.gym_usuario_rol_gym_usuario_rol_id_seq'::regclass);


--
-- Name: alumno alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno
    ADD CONSTRAINT alumno_pkey PRIMARY KEY (id);


--
-- Name: ingreso diaingreso_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingreso
    ADD CONSTRAINT diaingreso_pkey PRIMARY KEY (id);


--
-- Name: alumno_estado estadoalumno_descripcionestadoalumno_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_estado
    ADD CONSTRAINT estadoalumno_descripcionestadoalumno_key UNIQUE (descripcion);


--
-- Name: alumno_estado estadoalumno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_estado
    ADD CONSTRAINT estadoalumno_pkey PRIMARY KEY (id);


--
-- Name: membresia fechadisponible_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT fechadisponible_pkey PRIMARY KEY (id);


--
-- Name: alumno_estado_log gym_log_estado_alumno_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno_estado_log
    ADD CONSTRAINT gym_log_estado_alumno_pkey PRIMARY KEY (id);


--
-- Name: rol gym_rol_gym_rol_codigo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT gym_rol_gym_rol_codigo_key UNIQUE (codigo);


--
-- Name: rol gym_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rol
    ADD CONSTRAINT gym_rol_pkey PRIMARY KEY (id);


--
-- Name: usuario_rol gym_usuario_rol_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT gym_usuario_rol_pkey PRIMARY KEY (id);


--
-- Name: persona persona_correoelectronico_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_correoelectronico_key UNIQUE (email);


--
-- Name: persona persona_numerodocumento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_numerodocumento_key UNIQUE (documento);


--
-- Name: persona persona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_pkey PRIMARY KEY (id);


--
-- Name: sexo sexopersona_descripcionsexo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sexo
    ADD CONSTRAINT sexopersona_descripcionsexo_key UNIQUE (descripcion);


--
-- Name: sexo sexopersona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sexo
    ADD CONSTRAINT sexopersona_pkey PRIMARY KEY (id);


--
-- Name: software_pago software_pago_mp_payment_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.software_pago
    ADD CONSTRAINT software_pago_mp_payment_id_key UNIQUE (mp_payment_id);


--
-- Name: software_pago software_pago_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.software_pago
    ADD CONSTRAINT software_pago_pkey PRIMARY KEY (id);


--
-- Name: software_suscripcion software_suscripcion_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.software_suscripcion
    ADD CONSTRAINT software_suscripcion_pkey PRIMARY KEY (id);


--
-- Name: tipo_documento tipodocumento_descripciondocumento_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documento
    ADD CONSTRAINT tipodocumento_descripciondocumento_key UNIQUE (descripcion);


--
-- Name: tipo_documento tipodocumento_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_documento
    ADD CONSTRAINT tipodocumento_pkey PRIMARY KEY (id);


--
-- Name: tipo_persona tipopersona_descripciontipopersona_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_persona
    ADD CONSTRAINT tipopersona_descripciontipopersona_key UNIQUE (descripcion);


--
-- Name: tipo_persona tipopersona_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tipo_persona
    ADD CONSTRAINT tipopersona_pkey PRIMARY KEY (id);


--
-- Name: plan_tipo tipoplan_descripciontipoplan_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_tipo
    ADD CONSTRAINT tipoplan_descripciontipoplan_key UNIQUE (descripcion);


--
-- Name: plan_tipo tipoplan_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.plan_tipo
    ADD CONSTRAINT tipoplan_pkey PRIMARY KEY (id);


--
-- Name: usuario_rol uq_usuario_rol; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT uq_usuario_rol UNIQUE (usuario_id, rol_id);


--
-- Name: usuario usuario_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_pkey PRIMARY KEY (id);


--
-- Name: alumno alumno_idestadoalumno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno
    ADD CONSTRAINT alumno_idestadoalumno_fkey FOREIGN KEY (estado_id) REFERENCES public.alumno_estado(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: alumno alumno_idpersona_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno
    ADD CONSTRAINT alumno_idpersona_fkey FOREIGN KEY (persona_id) REFERENCES public.persona(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: alumno alumno_idtipoplan_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alumno
    ADD CONSTRAINT alumno_idtipoplan_fkey FOREIGN KEY (plan_tipo_id) REFERENCES public.plan_tipo(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ingreso diaingreso_idfecha_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ingreso
    ADD CONSTRAINT diaingreso_idfecha_fkey FOREIGN KEY (membresia_id) REFERENCES public.membresia(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: membresia fechadisponible_idalumno_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT fechadisponible_idalumno_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumno(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: membresia fk_fecha_usuario_cobro; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT fk_fecha_usuario_cobro FOREIGN KEY (cobrado_por_id) REFERENCES public.usuario(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: membresia fk_tipoplan_fecha; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.membresia
    ADD CONSTRAINT fk_tipoplan_fecha FOREIGN KEY (plan_tipo_id) REFERENCES public.plan_tipo(id);


--
-- Name: usuario_rol fk_usuario_rol_rol; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT fk_usuario_rol_rol FOREIGN KEY (rol_id) REFERENCES public.rol(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuario_rol fk_usuario_rol_usuario; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario_rol
    ADD CONSTRAINT fk_usuario_rol_usuario FOREIGN KEY (usuario_id) REFERENCES public.usuario(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: persona persona_idsexo_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_idsexo_fkey FOREIGN KEY (sexo_id) REFERENCES public.sexo(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: persona persona_idtipodocumento_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_idtipodocumento_fkey FOREIGN KEY (tipo_documento_id) REFERENCES public.tipo_documento(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: persona persona_idtipopersona_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.persona
    ADD CONSTRAINT persona_idtipopersona_fkey FOREIGN KEY (tipo_persona_id) REFERENCES public.tipo_persona(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: usuario usuario_idpersona_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuario
    ADD CONSTRAINT usuario_idpersona_fkey FOREIGN KEY (persona_id) REFERENCES public.persona(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--




--
-- PostgreSQL database dump
--


-- Dumped from database version 17.9
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: vista_recaudacion_completa; Type: VIEW; Schema: gym_v3; Owner: -
--

CREATE VIEW gym_v3.vista_recaudacion_completa AS
 SELECT 'historico'::text AS origen,
    m.id,
    ((p.apellido || ', '::text) || p.nombre) AS alumno,
    (p.documento)::text AS dni,
    pt.descripcion AS plan,
    m.monto_pagado,
    m.metodo_pago,
    m.fecha_inicio,
    m.fecha_fin,
    m.dias_totales,
    m.ingresos_disponibles
   FROM (((public.membresia m
     JOIN public.alumno a ON ((a.id = m.alumno_id)))
     JOIN public.persona p ON ((p.id = a.persona_id)))
     LEFT JOIN public.plan_tipo pt ON ((pt.id = m.plan_tipo_id)))
UNION ALL
 SELECT 'actual'::text AS origen,
    m.id,
    (((p.apellido)::text || ', '::text) || (p.nombre)::text) AS alumno,
    (p.documento)::text AS dni,
    pt.descripcion AS plan,
    m.monto_pagado,
    m.metodo_pago,
    m.fecha_inicio,
    m.fecha_fin,
    m.dias_totales,
    m.ingresos_disponibles
   FROM (((gym_v3.membresia m
     JOIN gym_v3.alumno a ON ((a.id = m.alumno_id)))
     JOIN gym_v3.persona p ON ((p.id = a.persona_id)))
     LEFT JOIN gym_v3.plan_tipo pt ON ((pt.id = m.plan_tipo_id)))
  WHERE (NOT (m.id IN ( SELECT membresia.id
           FROM public.membresia)));


--
-- PostgreSQL database dump complete
--



