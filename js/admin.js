import {
  createRow,
  createStoragePath,
  getPublicPdfUrl,
  getSession,
  isAdmin,
  listAdminContent,
  removeUploadedPdf,
  signIn,
  signOut,
  updateRow,
  uploadPdf,
  validatePdfFile
} from './supabase-api.js';

const state = { session: null, sections: [], documents: [] };
const $ = id => document.getElementById(id);

const elements = {
  message: $('global-message'),
  loginView: $('login-view'),
  dashboardView: $('dashboard-view'),
  loginForm: $('login-form'),
  sessionActions: $('session-actions'),
  sessionEmail: $('session-email'),
  logoutButton: $('logout-button'),
  dashboardLoading: $('dashboard-loading'),
  sectionsList: $('sections-list'),
  newSectionButton: $('new-section-button'),
  sectionDialog: $('section-dialog'),
  sectionForm: $('section-form'),
  documentDialog: $('document-dialog'),
  documentForm: $('document-form'),
  uploadProgress: $('upload-progress'),
  uploadPercent: $('upload-percent'),
  uploadProgressBar: $('upload-progress-bar'),
  saveDocumentButton: $('save-document-button')
};

function node(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== '') element.textContent = text;
  return element;
}

function actionButton(text, handler, { danger = false } = {}) {
  const button = node('button', `small-button${danger ? ' small-button--danger' : ''}`, text);
  button.type = 'button';
  button.addEventListener('click', handler);
  return button;
}

function showMessage(message, type = 'info') {
  elements.message.textContent = message;
  elements.message.className = `message message--${type}`;
  elements.message.hidden = false;
  elements.message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideMessage() {
  elements.message.hidden = true;
  elements.message.textContent = '';
}

function friendlyError(error) {
  const source = String(error?.message || error || 'Erro inesperado.');
  if (/invalid login credentials/i.test(source)) return 'E-mail ou senha incorretos.';
  if (/email not confirmed/i.test(source)) return 'O e-mail deste usuário ainda não foi confirmado.';
  if (/failed to fetch|network|rede/i.test(source)) return 'Não foi possível conectar ao serviço. Verifique sua internet e tente novamente.';
  if (/row-level security|permission denied|403/i.test(source)) return 'Seu usuário não possui permissão para realizar esta operação.';
  if (/duplicate|already exists|409/i.test(source)) return 'Já existe um registro ou arquivo com esses dados.';
  return source;
}

function containsMarkup(value) {
  return /<\/?[a-z][^>]*>/i.test(String(value));
}

function requireSafeText(value, label) {
  const text = String(value || '').trim();
  if (!text) throw new TypeError(`${label} é obrigatório.`);
  if (containsMarkup(text)) throw new TypeError(`${label} não pode conter HTML.`);
  return text;
}

function setAuthenticatedView(authenticated) {
  elements.loginView.hidden = authenticated;
  elements.dashboardView.hidden = !authenticated;
  elements.sessionActions.hidden = !authenticated;
  elements.sessionEmail.textContent = authenticated ? state.session?.user?.email || '' : '';
}

async function requireSession() {
  const session = await getSession();
  if (!session) {
    state.session = null;
    setAuthenticatedView(false);
    throw new Error('Sua sessão expirou. Entre novamente.');
  }
  state.session = session;
  return session;
}

function sortContent() {
  state.sections.sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, 'pt-BR'));
  state.documents.sort((a, b) => a.position - b.position || a.title.localeCompare(b.title, 'pt-BR'));
}

function statusPill(text, modifier) {
  return node('span', `status-pill status-pill--${modifier}`, text);
}

function renderDocument(documentData) {
  const row = node('article', `document-row${documentData.archived_at ? ' document-row--archived' : ''}`);
  const content = node('div');
  const titleLine = node('div', 'document-title');
  titleLine.append(node('strong', '', documentData.title));
  if (documentData.badge) titleLine.append(node('span', 'badge', documentData.badge));
  if (documentData.archived_at) titleLine.append(statusPill('Arquivado', 'archived'));
  else if (documentData.published) titleLine.append(statusPill('Publicado', 'published'));
  else titleLine.append(statusPill('Oculto', 'hidden'));
  const description = node('p', 'document-description', documentData.description);
  content.append(titleLine, description);

  const actions = node('div', 'document-actions');
  const open = node('a', 'small-button', 'Abrir PDF');
  open.href = getPublicPdfUrl(documentData.storage_path);
  open.target = '_blank';
  open.rel = 'noopener';
  actions.append(open, actionButton('Editar', () => openDocumentDialog(documentData)));

  if (!documentData.archived_at) {
    actions.append(
      actionButton(documentData.published ? 'Ocultar' : 'Publicar', () => toggleDocument(documentData)),
      actionButton('Arquivar', () => archiveDocument(documentData), { danger: true })
    );
  }
  row.append(content, actions);
  return row;
}

function renderSection(section) {
  const card = node('section', `section-card${section.published ? '' : ' section-card--hidden'}`);
  const header = node('header', 'section-card-header');
  const heading = node('div');
  const title = node('h2', '', section.title);
  const metadata = node('div', 'section-meta');
  const documents = state.documents.filter(documentData => documentData.section_id === section.id);
  const activeCount = documents.filter(documentData => !documentData.archived_at).length;
  metadata.append(
    statusPill(section.published ? 'Categoria publicada' : 'Categoria oculta', section.published ? 'published' : 'hidden'),
    node('span', '', `${activeCount} ${activeCount === 1 ? 'documento ativo' : 'documentos ativos'}`),
    node('span', '', `Ordem ${section.position}`)
  );
  heading.append(title, metadata);

  const actions = node('div', 'section-actions');
  actions.append(
    actionButton('Editar categoria', () => openSectionDialog(section)),
    actionButton('Adicionar PDF', () => openDocumentDialog(null, section.id))
  );
  header.append(heading, actions);
  card.append(header);

  const list = node('div', 'documents-list');
  if (documents.length === 0) list.append(node('p', 'section-empty', 'Nenhum documento nesta categoria.'));
  else documents.forEach(documentData => list.append(renderDocument(documentData)));
  card.append(list);
  return card;
}

function renderDashboard() {
  sortContent();
  elements.sectionsList.replaceChildren();
  if (state.sections.length === 0) {
    elements.sectionsList.append(node('p', 'empty-state', 'Nenhuma categoria cadastrada. Crie a primeira categoria para adicionar documentos.'));
    return;
  }
  state.sections.forEach(section => elements.sectionsList.append(renderSection(section)));
}

async function loadContent() {
  elements.dashboardLoading.hidden = false;
  elements.sectionsList.hidden = true;
  const session = await requireSession();
  const content = await listAdminContent(session);
  state.sections = content.sections || [];
  state.documents = content.documents || [];
  renderDashboard();
  elements.dashboardLoading.hidden = true;
  elements.sectionsList.hidden = false;
}

function openSectionDialog(section = null) {
  $('section-dialog-title').textContent = section ? 'Editar categoria' : 'Nova categoria';
  $('section-id').value = section?.id || '';
  $('section-title').value = section?.title || '';
  $('section-highlight').value = section?.highlight || '';
  $('section-description').value = section?.description || '';
  $('section-position').value = section?.position ?? 10;
  $('section-published').checked = section?.published ?? true;
  elements.sectionDialog.showModal();
  $('section-title').focus();
}

function populateSectionSelect(selectedId = '') {
  const select = $('document-section');
  select.replaceChildren();
  state.sections.forEach(section => {
    const option = node('option', '', section.title);
    option.value = section.id;
    option.selected = section.id === selectedId;
    select.append(option);
  });
}

function resetUploadProgress() {
  elements.uploadProgress.hidden = true;
  elements.uploadPercent.textContent = '0%';
  elements.uploadProgressBar.value = 0;
}

function openDocumentDialog(documentData = null, sectionId = '') {
  if (state.sections.length === 0) {
    showMessage('Crie uma categoria antes de adicionar um documento.', 'error');
    return;
  }
  $('document-dialog-title').textContent = documentData ? 'Editar documento' : 'Novo documento';
  $('document-id').value = documentData?.id || '';
  populateSectionSelect(documentData?.section_id || sectionId || state.sections[0].id);
  $('document-title').value = documentData?.title || '';
  $('document-description').value = documentData?.description || '';
  $('document-badge').value = documentData?.badge || '';
  $('document-position').value = documentData?.position ?? 10;
  $('document-published').checked = documentData?.published ?? true;
  $('document-file').value = '';
  $('document-file').required = !documentData;
  $('document-file-help').textContent = documentData ? '(opcional — escolha somente para substituir)' : '(obrigatório)';
  resetUploadProgress();
  elements.documentDialog.showModal();
  $('document-title').focus();
}

async function toggleDocument(documentData) {
  hideMessage();
  try {
    await updateRow('transparency_documents', documentData.id, { published: !documentData.published }, await requireSession());
    await loadContent();
    showMessage(documentData.published ? 'Documento ocultado da página pública.' : 'Documento publicado com sucesso.', 'success');
  } catch (error) {
    showMessage(friendlyError(error), 'error');
  }
}

async function archiveDocument(documentData) {
  const confirmed = window.confirm(`Arquivar “${documentData.title}”? O documento deixará de aparecer no site, mas o registro e o PDF serão preservados.`);
  if (!confirmed) return;
  hideMessage();
  try {
    await updateRow('transparency_documents', documentData.id, {
      published: false,
      archived_at: new Date().toISOString()
    }, await requireSession());
    await loadContent();
    showMessage('Documento arquivado. O arquivo original foi preservado.', 'success');
  } catch (error) {
    showMessage(friendlyError(error), 'error');
  }
}

elements.loginForm.addEventListener('submit', async event => {
  event.preventDefault();
  hideMessage();
  const submit = elements.loginForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  submit.textContent = 'Entrando…';
  try {
    const session = await signIn($('login-email').value, $('login-password').value);
    if (!(await isAdmin(session))) {
      await signOut();
      throw new Error('Este usuário não está autorizado a administrar o site.');
    }
    state.session = session;
    elements.loginForm.reset();
    setAuthenticatedView(true);
    await loadContent();
    showMessage('Acesso realizado com sucesso.', 'success');
  } catch (error) {
    showMessage(friendlyError(error), 'error');
  } finally {
    submit.disabled = false;
    submit.textContent = 'Entrar';
  }
});

elements.logoutButton.addEventListener('click', async () => {
  await signOut();
  state.session = null;
  state.sections = [];
  state.documents = [];
  setAuthenticatedView(false);
  showMessage('Sessão encerrada com segurança.', 'info');
});

elements.newSectionButton.addEventListener('click', () => openSectionDialog());

elements.sectionForm.addEventListener('submit', async event => {
  event.preventDefault();
  hideMessage();
  const submit = elements.sectionForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  try {
    const title = requireSafeText($('section-title').value, 'Título');
    const highlight = $('section-highlight').value.trim();
    const description = $('section-description').value.trim();
    if (containsMarkup(highlight) || containsMarkup(description)) throw new TypeError('Os campos não podem conter HTML.');
    if (highlight && !title.includes(highlight)) throw new TypeError('O trecho em destaque deve ser copiado exatamente do título.');
    const data = {
      title,
      highlight,
      description,
      position: Number($('section-position').value),
      published: $('section-published').checked
    };
    const id = $('section-id').value;
    if (id) await updateRow('transparency_sections', id, data, await requireSession());
    else await createRow('transparency_sections', data, await requireSession());
    elements.sectionDialog.close();
    await loadContent();
    showMessage(id ? 'Categoria atualizada.' : 'Categoria criada.', 'success');
  } catch (error) {
    showMessage(friendlyError(error), 'error');
  } finally {
    submit.disabled = false;
  }
});

elements.documentForm.addEventListener('submit', async event => {
  event.preventDefault();
  hideMessage();
  elements.saveDocumentButton.disabled = true;
  elements.saveDocumentButton.textContent = 'Salvando…';
  let uploadedPath = '';
  try {
    const existingId = $('document-id').value;
    const documentId = existingId || crypto.randomUUID();
    const file = $('document-file').files[0] || null;
    const data = {
      section_id: $('document-section').value,
      title: requireSafeText($('document-title').value, 'Título'),
      description: requireSafeText($('document-description').value, 'Descrição'),
      badge: $('document-badge').value.trim(),
      position: Number($('document-position').value),
      published: $('document-published').checked,
      archived_at: null
    };
    if (containsMarkup(data.badge)) throw new TypeError('O selo não pode conter HTML.');

    const session = await requireSession();
    if (file) {
      await validatePdfFile(file);
      uploadedPath = createStoragePath(documentId, file.name);
      elements.uploadProgress.hidden = false;
      await uploadPdf(file, uploadedPath, session, percent => {
        elements.uploadPercent.textContent = `${percent}%`;
        elements.uploadProgressBar.value = percent;
      });
      Object.assign(data, {
        storage_path: uploadedPath,
        original_name: file.name.slice(0, 255),
        file_size: file.size,
        mime_type: 'application/pdf'
      });
    } else if (!existingId) {
      throw new TypeError('Selecione o arquivo PDF.');
    }

    if (existingId) await updateRow('transparency_documents', existingId, data, session);
    else await createRow('transparency_documents', { id: documentId, ...data }, session);
    uploadedPath = '';
    elements.documentDialog.close();
    await loadContent();
    showMessage(existingId ? 'Documento atualizado.' : 'Documento publicado.', 'success');
  } catch (error) {
    if (uploadedPath) {
      try {
        await removeUploadedPdf(uploadedPath, state.session);
      } catch {
        console.warn('Não foi possível remover o upload incompleto:', uploadedPath);
      }
    }
    showMessage(friendlyError(error), 'error');
  } finally {
    elements.saveDocumentButton.disabled = false;
    elements.saveDocumentButton.textContent = 'Salvar documento';
  }
});

document.querySelectorAll('[data-close-dialog]').forEach(button => {
  button.addEventListener('click', () => {
    const dialog = $(button.dataset.closeDialog);
    if (dialog?.open) dialog.close();
  });
});

for (const dialog of [elements.sectionDialog, elements.documentDialog]) {
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
}

async function initialize() {
  try {
    const session = await getSession();
    if (session && await isAdmin(session)) {
      state.session = session;
      setAuthenticatedView(true);
      await loadContent();
    } else {
      if (session) await signOut();
      setAuthenticatedView(false);
    }
  } catch (error) {
    setAuthenticatedView(false);
    showMessage(`O painel ainda não está disponível: ${friendlyError(error)}`, 'error');
  }
}

initialize();

