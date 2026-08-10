import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL
} from '../js/supabase-config.js';

const headers = {
  apikey: SUPABASE_PUBLISHABLE_KEY,
  Accept: 'application/json'
};

async function readTable(table) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`${table}: HTTP ${response.status} — ${text}`);
  return JSON.parse(text);
}

try {
  const [sections, documents, adminProbe] = await Promise.all([
    readTable('transparency_sections'),
    readTable('transparency_documents'),
    fetch(`${SUPABASE_URL}/rest/v1/admin_users?select=user_id`, { headers })
  ]);
  if (adminProbe.ok) throw new Error('A tabela admin_users não deveria ser consultável anonimamente.');
  console.log(`Supabase público validado: ${sections.length} categorias e ${documents.length} documentos visíveis.`);
  console.log(`Bloqueio anônimo de admin_users confirmado (HTTP ${adminProbe.status}).`);
} catch (error) {
  console.error(`ERRO: ${error.message}`);
  process.exitCode = 1;
}
