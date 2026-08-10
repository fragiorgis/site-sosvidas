-- Correção para projetos que já executaram 202608090001 antes da inclusão
-- dos grants explícitos. Seguro para executar mais de uma vez.

grant usage on schema public to service_role;
grant all on public.admin_users to service_role;
grant all on public.transparency_sections to service_role;
grant all on public.transparency_documents to service_role;
grant all on public.transparency_audit_log to service_role;
grant usage, select on sequence public.transparency_audit_log_id_seq to service_role;

-- O Storage normalmente já concede estes privilégios ao service_role, mas
-- os grants abaixo tornam a migração independente da configuração inicial.
grant select, insert, update, delete on storage.buckets to service_role;
grant select, insert, update, delete on storage.objects to service_role;
