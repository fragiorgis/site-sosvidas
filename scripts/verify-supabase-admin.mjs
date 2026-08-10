import {
  SUPABASE_STORAGE_BUCKET,
  SUPABASE_URL
} from '../js/supabase-config.js';

const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!secretKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida.');

const headers = { apikey: secretKey, Accept: 'application/json' };

async function parse(response, label) {
  const text = await response.text();
  if (!response.ok) throw new Error(`${label}: HTTP ${response.status} — ${text}`);
  return text ? JSON.parse(text) : null;
}

async function getTable(table, select) {
  const query = new URLSearchParams({ select });
  return parse(
    await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, { headers }),
    table
  );
}

const [admins, sections, documents, authResult] = await Promise.all([
  getTable('admin_users', 'user_id'),
  getTable('transparency_sections', 'id'),
  getTable('transparency_documents', 'id,storage_path,file_size'),
  parse(await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=100`, { headers }), 'auth.users')
]);

if (admins.length !== 1) throw new Error(`Esperado 1 administrador, encontrado ${admins.length}.`);
if (sections.length !== 5) throw new Error(`Esperadas 5 categorias, encontradas ${sections.length}.`);
if (documents.length !== 31) throw new Error(`Esperados 31 documentos, encontrados ${documents.length}.`);

const authUsers = Array.isArray(authResult) ? authResult : authResult.users;
if (!Array.isArray(authUsers) || !authUsers.some(user => user.id === admins[0].user_id)) {
  throw new Error('O administrador autorizado não corresponde a um usuário do Supabase Auth.');
}

const pdfChecks = await Promise.all(documents.map(async documentData => {
  const encodedPath = documentData.storage_path.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${encodedPath}`,
    { method: 'HEAD' }
  );
  const contentType = response.headers.get('content-type') || '';
  const contentLength = Number(response.headers.get('content-length') || 0);
  return {
    ok: response.ok && contentType.toLowerCase().includes('application/pdf') && contentLength === documentData.file_size,
    status: response.status,
    contentType,
    contentLength,
    expectedLength: documentData.file_size,
    path: documentData.storage_path
  };
}));

const failures = pdfChecks.filter(result => !result.ok);
if (failures.length) {
  throw new Error(`Falha ao validar ${failures.length} PDF(s): ${JSON.stringify(failures.slice(0, 3))}`);
}

console.log('Validação administrativa aprovada:');
console.log('- 1 usuário administrativo autorizado e existente no Auth;');
console.log('- 5 categorias e 31 documentos no banco;');
console.log('- 31 PDFs públicos com tipo e tamanho corretos.');

