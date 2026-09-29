-- ============================================================================
-- Endurecimiento de permisos - correr completo en Supabase > SQL Editor
-- No cambia nada de lo que la app hace hoy: solo recorta permisos que sobran.
-- ============================================================================

-- 1) anon = visitante SIN sesion iniciada. No necesita ningun permiso aqui.
revoke all on public.asistencias     from anon;
revoke all on public.inscripciones   from anon;
revoke all on public.jornadas        from anon;
revoke all on public.locations       from anon;
revoke all on public.marketing_tasks from anon;

-- 2) TRUNCATE vacia una tabla entera y NO pasa por las politicas RLS.
--    Ningun usuario del lado cliente debe tenerlo.
revoke truncate, references, trigger on
  public.asistencias, public.inscripciones, public.jornadas,
  public.locations, public.marketing_tasks, public.profiles
from authenticated;

-- 3) Red de seguridad: aunque en el futuro alguien conceda permisos de mas por
--    error, este trigger impide cambiar las columnas que definen quien eres y
--    que puedes ver. Solo un ADMIN (o el backend) puede tocarlas.
create or replace function public.profiles_guard_sensible()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $fn$
begin
  if ( new.role      is distinct from old.role
    or new.is_active is distinct from old.is_active
    or new.qr_token  is distinct from old.qr_token
    or new.id        is distinct from old.id
    or new.email     is distinct from old.email
    or new.area      is distinct from old.area )
  and current_user not in ('service_role','supabase_admin','postgres')
  and not public.es_admin()
  then
    raise exception 'No autorizado a modificar columnas sensibles del perfil';
  end if;
  return new;
end;
$fn$;

drop trigger if exists trg_profiles_guard on public.profiles;
create trigger trg_profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard_sensible();
