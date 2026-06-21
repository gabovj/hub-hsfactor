-- =============================================================
-- Migración Hub v1 → v2
-- Ejecutar en Supabase SQL Editor (como postgres / service role)
-- Orden: primero usuarios, luego oportunidades (por las FKs)
-- =============================================================

-- -------------------------------------------------------------
-- PASO 1: Usuarios
-- Fuente: auth.users + public.user_roles
-- Destino: hub.users
-- Todos inician con is_active = FALSE y sin contraseña.
-- Activarán su cuenta via email de invitación (Phase 9b).
-- -------------------------------------------------------------
INSERT INTO hub.users (id, email, hashed_password, role, is_active, created_at, updated_at)
SELECT
    u.id,
    u.email,
    NULL,
    ur.role::text::hub.user_role,
    FALSE,
    u.created_at,
    now()
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- PASO 2: Oportunidades
-- Fuente: public.crm_oportunidades
-- Destino: hub.crm_oportunidades
-- vendedor_id y created_by se nullifican si el usuario
-- no existe en hub.users (evita violaciones de FK).
-- -------------------------------------------------------------
INSERT INTO hub.crm_oportunidades (
    id,
    nombre,
    email,
    telefono,
    empresa,
    tamano,
    ubicacion,
    fuente,
    etapa,
    vendedor_id,
    producto_recomendado,
    observaciones,
    created_by,
    created_at,
    updated_at,
    eliminado
)
SELECT
    o.id,
    o.nombre,
    o.email,
    o.telefono,
    o.empresa,
    o.tamano,
    o.ubicacion,
    o.fuente,
    o.etapa::text::hub.crm_etapa,
    (SELECT id FROM hub.users WHERE id = o.vendedor_id LIMIT 1),
    o.producto_recomendado,
    o.observaciones,
    (SELECT id FROM hub.users WHERE id = o.created_by LIMIT 1),
    o.created_at,
    o.updated_at,
    o.eliminado
FROM public.crm_oportunidades o
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------------
-- VERIFICACIÓN (correr después para confirmar)
-- -------------------------------------------------------------
-- SELECT COUNT(*) FROM hub.users;
-- SELECT COUNT(*) FROM hub.crm_oportunidades;
-- SELECT COUNT(*) FROM public.user_roles;
-- SELECT COUNT(*) FROM public.crm_oportunidades;
