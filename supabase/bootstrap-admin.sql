-- 1. Crie o usuário em Authentication > Users > Add user e marque o e-mail como confirmado.
-- 2. Substitua o endereço abaixo e execute somente este INSERT no SQL Editor.

insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('SUBSTITUA-PELO-EMAIL-DO-ADMINISTRADOR')
on conflict (user_id) do nothing;

-- O resultado deve retornar exatamente um administrador.
select au.user_id, u.email, au.created_at
from public.admin_users au
join auth.users u on u.id = au.user_id;

