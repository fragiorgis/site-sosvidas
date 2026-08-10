import {
  MAX_PDF_BYTES,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_STORAGE_BUCKET,
  SUPABASE_URL
} from './supabase-config.js';

const SESSION_KEY = 'sosvidas.admin.session';
const AUTH_BASE = `${SUPABASE_URL}/auth/v1`;
const REST_BASE = `${SUPABASE_URL}/rest/v1`;
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1`;

function jsonHeaders(accessToken) {
  const headers = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    'Content-Type': 'application/json'
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function parseResponse(response) {
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!response.ok) {
    const message = body?.message || body?.error_description || body?.error || body?.hint || `Erro HTTP ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return body;
}

async function request(url, options = {}) {
  const response = await fetch(url, options);
  return parseResponse(response);
}

function saveSession(session) {
  const normalized = {
    ...session,
    expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600)
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
  return normalized;
}

function readStoredSession() {
  try {
    const value = sessionStorage.getItem(SESSION_KEY);
    return value ? JSON.parse(value) : null;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function signIn(email, password) {
  const session = await request(`${AUTH_BASE}/token?grant_type=password`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({ email: String(email).trim(), password })
  });
  return saveSession(session);
}

async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  try {
    const refreshed = await request(`${AUTH_BASE}/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    return saveSession(refreshed);
  } catch {
    clearSession();
    return null;
  }
}

export async function getSession() {
  const session = readStoredSession();
  if (!session) return null;
  const expiresSoon = Number(session.expires_at || 0) * 1000 <= Date.now() + 60_000;
  return expiresSoon ? refreshSession(session) : session;
}

export async function signOut() {
  const session = readStoredSession();
  try {
    if (session?.access_token) {
      await request(`${AUTH_BASE}/logout`, {
        method: 'POST',
        headers: jsonHeaders(session.access_token)
      });
    }
  } finally {
    clearSession();
  }
}

function postgrestUrl(table, query = '') {
  return `${REST_BASE}/${table}${query ? `?${query}` : ''}`;
}

export async function isAdmin(session) {
  if (!session?.user?.id || !session.access_token) return false;
  const query = new URLSearchParams({
    select: 'user_id',
    user_id: `eq.${session.user.id}`,
    limit: '1'
  });
  const rows = await request(postgrestUrl('admin_users', query), {
    headers: jsonHeaders(session.access_token)
  });
  return Array.isArray(rows) && rows.length === 1;
}

export async function listAdminContent(session) {
  const sectionQuery = new URLSearchParams({
    select: 'id,title,highlight,description,position,published,created_at,updated_at',
    order: 'position.asc,title.asc'
  });
  const documentQuery = new URLSearchParams({
    select: 'id,section_id,title,description,badge,storage_path,original_name,file_size,mime_type,position,published,archived_at,created_at,updated_at',
    order: 'position.asc,title.asc'
  });

  const [sections, documents] = await Promise.all([
    request(postgrestUrl('transparency_sections', sectionQuery), { headers: jsonHeaders(session.access_token) }),
    request(postgrestUrl('transparency_documents', documentQuery), { headers: jsonHeaders(session.access_token) })
  ]);
  return { sections, documents };
}

export async function createRow(table, data, session) {
  return request(postgrestUrl(table), {
    method: 'POST',
    headers: {
      ...jsonHeaders(session.access_token),
      Prefer: 'return=representation'
    },
    body: JSON.stringify(data)
  });
}

export async function updateRow(table, id, data, session) {
  return request(postgrestUrl(table, `id=eq.${encodeURIComponent(id)}`), {
    method: 'PATCH',
    headers: {
      ...jsonHeaders(session.access_token),
      Prefer: 'return=representation'
    },
    body: JSON.stringify(data)
  });
}

export function getPublicPdfUrl(storagePath) {
  const encodedPath = String(storagePath || '')
    .split('/')
    .filter(Boolean)
    .map(segment => encodeURIComponent(segment))
    .join('/');
  return `${STORAGE_BASE}/object/public/${SUPABASE_STORAGE_BUCKET}/${encodedPath}`;
}

export function slugifyFilename(value) {
  const raw = String(value || 'documento.pdf').replace(/\.pdf$/i, '');
  const slug = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${slug || 'documento'}.pdf`;
}

export function createStoragePath(documentId, filename, now = Date.now()) {
  return `documents/${documentId}/${now}-${slugifyFilename(filename)}`;
}

export async function validatePdfFile(file) {
  if (!(file instanceof File)) throw new TypeError('Selecione um arquivo PDF.');
  if (!file.name.toLowerCase().endsWith('.pdf')) throw new TypeError('O arquivo deve possuir extensão .pdf.');
  if (file.type && file.type !== 'application/pdf') throw new TypeError('O tipo do arquivo deve ser application/pdf.');
  if (file.size === 0) throw new TypeError('O PDF está vazio.');
  if (file.size > MAX_PDF_BYTES) throw new TypeError('O PDF deve possuir no máximo 25 MB.');

  const header = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const signature = String.fromCharCode(...header);
  if (signature !== '%PDF-') throw new TypeError('O arquivo selecionado não possui uma assinatura PDF válida.');
  return true;
}

export function uploadPdf(file, storagePath, session, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/');
    xhr.open('POST', `${STORAGE_BASE}/object/${SUPABASE_STORAGE_BUCKET}/${encodedPath}`);
    xhr.setRequestHeader('apikey', SUPABASE_PUBLISHABLE_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
    xhr.setRequestHeader('Content-Type', 'application/pdf');
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.upload.addEventListener('progress', event => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        try {
          resolve(xhr.responseText ? JSON.parse(xhr.responseText) : null);
        } catch {
          resolve(null);
        }
      } else {
        let message = `Falha no upload (HTTP ${xhr.status}).`;
        try {
          const body = JSON.parse(xhr.responseText);
          message = body.message || body.error || message;
        } catch {
          // Mantém a mensagem HTTP segura.
        }
        reject(new Error(message));
      }
    });
    xhr.addEventListener('error', () => reject(new Error('Falha de rede durante o upload.')));
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelado.')));
    xhr.send(file);
  });
}

export async function removeUploadedPdf(storagePath, session) {
  return request(`${STORAGE_BASE}/object/${SUPABASE_STORAGE_BUCKET}`, {
    method: 'DELETE',
    headers: jsonHeaders(session.access_token),
    body: JSON.stringify({ prefixes: [storagePath] })
  });
}
