# Esquema de Base de Datos - Puriqay

> Generado automáticamente desde Supabase.

## Tabla: asistencias
- id (uuid)
- created_at (timestamp with time zone)
- jornada_id (uuid)
- volunteer_id (uuid)

## Tabla: inscripciones
- id (uuid)
- created_at (timestamp with time zone)
- jornada_id (uuid)
- volunteer_id (uuid)
- status (text)
- justification_type (text)
- justification_text (text)
- has_changed (boolean)
- updated_at (timestamp with time zone)

## Tabla: jornadas
- id (uuid)
- created_at (timestamp with time zone)
- location_id (uuid)
- name (text)
- date (date)
- start_time (time without time zone)
- end_time (time without time zone)
- valid_hours (numeric)
- type (text)
- description (text)
- coordinator_id (uuid)

## Tabla: locations
- id (uuid)
- created_at (timestamp with time zone)
- name (text)
- action_line (text)
- manager_name (text)
- contact_phone (text)
- address (text)
- district (text)
- maps_link (text)
- meeting_point (text)
- special_instructions (text)
- status (text)

## Tabla: marketing_tasks
- id (uuid)
- created_at (timestamp with time zone)
- title (text)
- content_type (text)
- assigned_to (uuid)
- networks (ARRAY)
- description (text)
- references (ARRAY, máx. 3 elementos — CHECK constraint `marketing_tasks_references_max3`)
- submission_link (text)
- draft_date (date)
- post_date (date)
- real_delivery_date (timestamp with time zone)
- extension_days (integer, default 0)
- is_active (boolean, default true)
- status (text)

## Tabla: profiles
- id (uuid)
- role (text)
- qr_token (uuid)
- is_active (boolean)
- created_at (timestamp with time zone)
- email (text)
- first_name (text)
- last_name (text)
- document_id (text, nullable — ver nota de onboarding progresivo)
- birth_date (date)
- phone (text)
- emergency_phone (text, nullable — ver nota de onboarding progresivo)
- study_center (text, nullable — ver nota de onboarding progresivo)
- career (text, nullable — ver nota de onboarding progresivo)
- address (text, nullable — ver nota de onboarding progresivo)
- latitude (double precision, nullable — ver nota de onboarding progresivo)
- longitude (double precision, nullable — ver nota de onboarding progresivo)
- join_date (date)
- position (text)
- area (text)
- medical_conditions (text, nullable — ver nota de onboarding progresivo)
- shirt_size (text, nullable — ver nota de onboarding progresivo)

**Onboarding progresivo:** `Register.tsx` (fase 1) solo pide `first_name`, `last_name`, `email`, `password`, `birth_date` y `phone`. Los campos marcados arriba se piden después, la primera vez que el usuario inicia sesión, mediante el modal bloqueante `CompleteProfileModal.tsx` (ver `Dashboard.tsx`). Por eso ya no tienen (o no deben tener) restricción `NOT NULL` en Supabase — si la tenían, el `insert` de la fase 1 fallaría.

