# Pendientes de configuración — Puriqay

Checklist de cosas que se hacen **fuera del código** (panel de Supabase, Resend, DNS).
Marca con [x] lo que vayas completando.

---

## TAREA 1 — Desbloquear el registro (URGENTE, 2 minutos)

**Problema:** "Confirm email" está activado pero no hay servidor de correo configurado.
El correo interno de Supabase solo entrega a miembros de la organización, así que
**ningún voluntario externo puede registrarse hoy**: se registra, ve "Revisa tu correo",
y ese correo nunca llega.

**Qué hacer:**

- [x] Supabase → `Authentication` → `Sign In / Providers` → abre **Email**
- [x] Busca **"Confirm email"** y **apágalo**
- [x] Baja hasta el final y dale **Save** (si no guardas, no se aplica)

Se reactiva cuando la TAREA 3 esté lista. No hay que tocar código: `Register.tsx`
funciona igual con la verificación prendida o apagada.

---

## TAREA 2 — Ver en qué estado está el dominio en Resend

- [x] Entra a resend.com → menú **Domains**
- [x] Mira qué dice `puriqay.org`: **VERIFIED** (confirmado 20-sep)
  - **Verified** (verde) → puedes hacer la TAREA 3
  - **Pending / Not Started** → tu amigo aún no puso los registros DNS en Cloudflare;
    sin eso no se puede avanzar

---

## TAREA 3 — Conectar Resend a Supabase (solo si el dominio dice "Verified")

### 3.1 Crear la API key
- [x] Resend → `API Keys` → **Create API Key** (permiso: Sending access, dominio: puriqay.org)
- [ ] Nombre: `supabase-smtp` · Permiso: **Sending access**
- [ ] Cópiala (empieza con `re_`). Solo se muestra una vez.
- [ ] **NO la guardes en este archivo ni en ningún otro del repo**: va directo al campo
      Password de Supabase. GitHub bloquea los push que contienen claves.

### 3.2 Configurar el SMTP
- [ ] Supabase → `Authentication` → `Emails` → pestaña **SMTP Settings**
      (o: `Project Settings` → `Authentication` → sección **SMTP Settings**)
- [x] Activa **Enable Custom SMTP** y llena:

| Campo | Valor |
|---|---|
| Sender email | `no-responder@puriqay.org` |
| Sender name | `Puriqay` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` (esa palabra literal, no tu correo) |
| Password | la API key `re_...` |

- [ ] **Save**

### 3.3 Subir el límite de correos
- [ ] Supabase → `Authentication` → `Rate Limits` → busca **"Emails per hour"**
- [ ] Súbelo a **100** → Save

### 3.4 Poner el diseño Puriqay al correo
- [ ] Supabase → `Authentication` → `Emails` → `Templates` → **"Confirm signup"**
- [ ] Borra todo el contenido y pega el archivo `supabase/email-templates/confirm-signup.html`
- [ ] Save

### 3.4b PROBAR el SMTP antes de reactivar la verificación

No reactives "Confirm email" a ciegas: si el SMTP quedó mal, vuelves a bloquear
el registro de todos. Pruébalo primero con un correo de invitación:

- [x] Supabase → `Authentication` → `Users` → botón **Invite user**
- [ ] Escribe un correo externo (uno que NO sea de tu organización Supabase)
- [x] Si el correo **llega** → el SMTP funciona ✅ (llegó a spam, ver nota al final)
- [ ] Si **no llega** → revisa Host/Port/Username/Password. El Username es la
      palabra `resend`, no tu correo. Y en Resend → `Logs` ves si el envío salió.
- [ ] Borra ese usuario de prueba después

### 3.5 Reactivar la verificación
- [ ] Vuelve a `Authentication` → `Sign In / Providers` → **Email** → activa **"Confirm email"** → Save
- [ ] `Authentication` → `URL Configuration` → **Site URL**: pon la URL real de la app
      (la de Netlify o el dominio), NO `localhost`

### 3.6 Probar
- [ ] Regístrate con un correo que NO sea el tuyo (pídele a alguien del equipo)
- [ ] Debe llegar el correo con diseño Puriqay desde `no-responder@puriqay.org`

---

## TAREA 4 — Cerrar la lectura de `locations` (seguridad)

**Problema:** cualquier usuario registrado puede leer la tabla `locations` completa,
incluyendo `contact_phone`, `manager_name`, `address` y `special_instructions` de los
aliados. La app solo necesita mostrarles nombre, distrito y punto de encuentro.

**El código ya está listo y desplegado** (`AvailableJornadas.tsx` lee de una vista).
Solo falta el SQL.

### 4.1 Antes de correr nada, verifica el deploy
- [x] Abre la app **publicada** (no localhost), entra con una cuenta de VOLUNTARIO
- [x] Ve a "Próximas Jornadas" y confirma que **se ve el nombre del lugar**
- [x] Si no ves jornadas o no aparece el lugar, **no sigas**: falta desplegar el código

### 4.2 Correr el SQL (Supabase → SQL Editor)

```sql
-- Vista con solo lo que un voluntario necesita ver del lugar
create or replace view public.locations_publicas as
select id, name, district, meeting_point from public.locations;

-- OJO: hay que revocar de AMBOS roles. Supabase da INSERT/UPDATE/DELETE por defecto
-- a anon y authenticated sobre objetos nuevos del esquema public, y como esta vista
-- es actualizable y corre con permisos del owner, eso permitiria borrar locations
-- saltandose RLS.
revoke all on public.locations_publicas from anon, authenticated;
grant select on public.locations_publicas to authenticated;

-- La tabla completa pasa a ser solo del equipo interno
drop policy if exists "locations_select" on public.locations;
drop policy if exists "locations_select_interno" on public.locations;

create policy "locations_select_interno" on public.locations
for select to authenticated using (public.es_equipo_interno());
```

### 4.3 Verificar
- [ ] Recarga la app como VOLUNTARIO → en "Próximas Jornadas" el lugar **sigue apareciendo**
- [ ] Entra como ADMIN → el módulo "Lugares" sigue mostrando todo (teléfonos incluidos)

### 4.4 Si algo se rompió, revertir

```sql
drop policy if exists "locations_select_interno" on public.locations;
create policy "locations_select" on public.locations
for select to authenticated using (true);
```

**Nota:** después de esto el Security Advisor va a mostrar un warning de
"Security Definer View" sobre `locations_publicas`. Es intencional: esa vista existe
justamente para exponer 4 columnas inofensivas sin dar acceso a la tabla completa.

---

## Ya completado (referencia)

- [x] Políticas RLS en las 6 tablas (antes todo era `ALL / true`, abierto a cualquiera)
- [x] Escalada de privilegios cerrada: `role`, `area`, `is_active` y `qr_token` ya no se
      pueden modificar desde la app (permisos por columna en `profiles`)
- [x] Trigger `handle_new_user` con `search_path` fijo y copiando la metadata del registro
- [x] Limpieza de datos de prueba (todo menos usuarios)

## Pendientes menores (sin urgencia)

- Leaked Password Protection: solo disponible en plan Pro, no se puede activar en Free
- Política de UPDATE para que un ADMIN pueda editar perfiles ajenos (hoy solo el propio).
  Hará falta si se quiere un botón "promover a Coordinador" en el módulo Voluntarios
- Template de correo para "Reset password" (recuperar contraseña): sigue con el diseño
  genérico de Supabase

---

## Nota: correos que caen en spam

Es normal al principio: un dominio recién verificado no tiene reputación de envío,
y los filtros desconfían de correos cortos con un solo enlace.

Qué ayuda:
1. Marcar "No es spam" y mover a Recibidos (pedírselo también al equipo en los
   primeros correos) — entrena los filtros rápido
2. El template con diseño puntúa mejor que el genérico: más texto real, estructura
   y el enlace en dos formatos
3. Consistencia: la reputación de `puriqay.org` mejora con envíos legítimos sostenidos
4. Opcional: en Resend → `Domains` → Configuration → "Enable tracking metrics" con
   subdominio propio, que ellos recomiendan para deliverability

NO subir el DMARC de `p=none` a `p=quarantine` todavía: hacerlo antes de tener
envíos estables puede tumbar correos legítimos.

---

## Lección aprendida: las vistas NO heredan la seguridad de la tabla

Al crear `locations_publicas`, Supabase le dio automáticamente INSERT/UPDATE/DELETE
a `anon` y `authenticated` (son los permisos por defecto del esquema `public`).

Como una vista simple sobre una sola tabla **es actualizable** y corre con los
permisos de su dueño (`postgres`), eso permitía hacer `delete from locations_publicas`
y borrar la tabla base **saltándose las políticas RLS**.

Regla para cualquier vista nueva:

```sql
revoke all on public.<vista> from anon, authenticated;
grant select on public.<vista> to authenticated;
```

Y verificar siempre con:

```sql
select grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name = '<vista>'
order by grantee, privilege_type;
```

---

# PLAN DE PRUEBAS

Cosas que se cambiaron y conviene probar antes de considerar el sistema listo.
Ordenadas por riesgo: las primeras son las que podrían estar rotas por RLS.

## A. Flujos que dependen de políticas RLS (alto riesgo)

- [ ] **Voluntario se inscribe a una jornada** → botón "Inscribirme a esta jornada".
      Debe guardar y mostrar "Ya estás inscrito". (Política `inscripciones_propias`)
- [ ] **Coordinador confirma/justifica asistencia** → "Sí, asistiré" / "No asistiré".
- [ ] **Coordinador escanea un QR** → módulo "Control de Asistencia".
      Debe encontrar al voluntario y registrar la asistencia.
      (Necesita leer `profiles` por `qr_token` + insertar en `asistencias`)
- [ ] **Admin edita un lugar** → botón del lápiz en Lugares, cambia algo y guarda.
      Si sale el error rojo de "no actualizó ninguna fila", falta política de UPDATE.
- [ ] **Módulo Marketing** → crear tarea, enviar a revisión, aprobar, extender plazo,
      archivar. (Política `marketing_interno`)
- [ ] **Coordinador con perfil incompleto** → debe salirle el modal pidiendo SOLO
      los campos vacíos, y al guardar no debe volver a pedirlos en el siguiente login.

## B. Prueba de seguridad (la que demuestra que locations quedó cerrado)

Con sesión de **VOLUNTARIO** abierta, F12 → Console. Reemplaza TU_URL y TU_ANON_KEY
por los valores de tu archivo `.env`:

```js
const k = Object.keys(localStorage).find(x => x.includes('auth-token'));
const token = JSON.parse(localStorage.getItem(k)).access_token;
const r = await fetch('TU_URL/rest/v1/locations?select=*', {
  headers: { apikey: 'TU_ANON_KEY', Authorization: 'Bearer ' + token }
});
console.log(await r.json());
```

- [ ] Debe devolver `[]` (vacío). Si devuelve los lugares con `contact_phone`,
      el cierre no quedó aplicado.

## C. Validaciones de formularios (recién desplegadas)

- [ ] **Crear lugar**: teléfono con letras o con más de 9 dígitos debe ser rechazado;
      los campos nuevos no deben dejar guardar vacíos
- [ ] **Registro**: contraseña corta o sin símbolo debe ser rechazada antes de enviar;
      nombres con números deben ser rechazados

## D. Correo (después de terminar la Tarea 3)

- [ ] Registro con correo externo → llega el correo CON diseño Puriqay
- [ ] El enlace del correo funciona y activa la cuenta
- [ ] Tras confirmar, el nombre y celular ya están guardados en `profiles`
