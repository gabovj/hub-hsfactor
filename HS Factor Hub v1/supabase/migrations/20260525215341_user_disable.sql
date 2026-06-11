-- Allow superadmins to enable/disable (ban) users and expose disabled status.

create or replace function public.get_users_with_roles()
returns table (
  id uuid,
  user_id uuid,
  role public.app_role,
  created_at timestamptz,
  email text,
  disabled boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'superadmin') then
    raise exception 'Not authorized';
  end if;

  return query
  select
    ur.id,
    ur.user_id,
    ur.role,
    ur.created_at,
    u.email::text,
    (u.banned_until is not null and u.banned_until > now()) as disabled
  from public.user_roles ur
  left join auth.users u on u.id = ur.user_id
  order by ur.created_at desc;
end;
$$;

create or replace function public.set_user_disabled(
  _target_user_id uuid,
  _disabled boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_role(auth.uid(), 'superadmin') then
    raise exception 'Not authorized';
  end if;

  if _target_user_id = auth.uid() then
    raise exception 'No puedes deshabilitarte a ti mismo';
  end if;

  if _disabled then
    update auth.users set banned_until = 'infinity'::timestamptz where id = _target_user_id;
  else
    update auth.users set banned_until = null where id = _target_user_id;
  end if;
end;
$$;

revoke all on function public.set_user_disabled(uuid, boolean) from public;
grant execute on function public.set_user_disabled(uuid, boolean) to authenticated;
