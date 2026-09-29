const DATA_URL = new URL('../data/transparencia.json', import.meta.url);

const compareByOrderAndTitle = (a, b) => {
  const orderDifference = Number(a.ordem) - Number(b.ordem);
  if (orderDifference !== 0) return orderDifference;
  return String(a.titulo).localeCompare(String(b.titulo), 'pt-BR');
};

export function isSafePdfPath(value) {
  if (typeof value !== 'string' || !value.toLowerCase().endsWith('.pdf')) return false;
  if (value.includes('..') || value.includes('\\') || /[?#]/.test(value)) return false;

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.includes('..') || decoded.includes('\\')) return false;

    return value.startsWith('/docs/') && decoded.startsWith('/docs/');
  } catch {
    return false;
  }
}

export function getVisibleSections(data) {
  if (!data || !Array.isArray(data.secoes)) {
    throw new TypeError('Formato inválido para os dados de transparência.');
  }

  return data.secoes
    .filter(section => section.publicada === true)
    .map(section => ({
      ...section,
      documentos: Array.isArray(section.documentos)
        ? section.documentos
            .filter(documentData => documentData.publicado === true && isSafePdfPath(documentData.arquivo))
            .sort(compareByOrderAndTitle)
        : []
    }))
    .sort(compareByOrderAndTitle);
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' }, cache: 'no-cache' });
  if (!response.ok) throw new Error(`Resposta HTTP ${response.status}`);
  return response.json();
}

export async function loadTransparencyData() {
  return fetchJson(DATA_URL);
}

function appendHighlightedText(element, title, highlight) {
  const safeTitle = String(title || '');
  const safeHighlight = String(highlight || '');
  const start = safeHighlight ? safeTitle.indexOf(safeHighlight) : -1;

  if (start < 0) {
    element.textContent = safeTitle;
    return;
  }

  element.append(document.createTextNode(safeTitle.slice(0, start)));
  const emphasis = document.createElement('em');
  emphasis.textContent = safeHighlight;
  element.append(emphasis, document.createTextNode(safeTitle.slice(start + safeHighlight.length)));
}

function createDocumentCard(documentData) {
  const card = document.createElement('article');
  card.className = 'relatorio-card';

  const icon = document.createElement('span');
  icon.className = 'relatorio-icon relatorio-icon--pdf';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = 'PDF';

  const info = document.createElement('div');
  info.className = 'relatorio-info';

  if (documentData.selo) {
    const badge = document.createElement('p');
    badge.className = 'relatorio-badge';
    badge.textContent = documentData.selo;
    info.append(badge);
  }

  const title = document.createElement('h3');
  title.textContent = documentData.titulo;
  const description = document.createElement('p');
  description.textContent = documentData.descricao;
  info.append(title, description);

  const link = document.createElement('a');
  link.className = 'relatorio-dl';
  link.href = documentData.arquivo;
  link.target = '_blank';
  link.rel = 'noopener';
  link.setAttribute('aria-label', `Abrir ${documentData.titulo} em PDF (nova aba)`);

  const arrow = document.createElement('span');
  arrow.setAttribute('aria-hidden', 'true');
  arrow.textContent = '↓';
  link.append(arrow, document.createTextNode(' PDF'));

  card.append(icon, info, link);
  return card;
}

function createSection(sectionData) {
  const section = document.createElement('section');
  section.className = 'doc-category';
  section.setAttribute('aria-labelledby', `secao-${sectionData.id}`);

  const header = document.createElement('div');
  header.className = 'doc-category-header';
  const title = document.createElement('h3');
  title.id = `secao-${sectionData.id}`;
  appendHighlightedText(title, sectionData.titulo, sectionData.destaque);
  const count = document.createElement('span');
  count.className = 'count';
  const total = sectionData.documentos.length;
  count.textContent = `${total} ${total === 1 ? 'documento' : 'documentos'}`;
  header.append(title, count);
  section.append(header);

  if (sectionData.descricao) {
    const description = document.createElement('p');
    description.className = 'doc-category-description';
    description.textContent = sectionData.descricao;
    section.append(description);
  }

  if (total === 0) {
    const empty = document.createElement('p');
    empty.className = 'documentos-empty';
    empty.textContent = 'Nenhum documento publicado nesta seção.';
    section.append(empty);
    return section;
  }

  const grid = document.createElement('div');
  grid.className = 'relatorio-grid';
  sectionData.documentos.forEach(documentData => grid.append(createDocumentCard(documentData)));
  section.append(grid);
  return section;
}

function renderError(container, status, retry) {
  container.replaceChildren();
  const error = document.createElement('div');
  error.className = 'documentos-state documentos-state--error';
  const title = document.createElement('strong');
  title.textContent = 'Não foi possível carregar os documentos agora.';
  const message = document.createElement('p');
  message.textContent = 'Tente novamente. Se o problema continuar, entre em contato com a SOS Vidas.';
  const button = document.createElement('button');
  button.className = 'documentos-retry';
  button.type = 'button';
  button.textContent = 'Tentar novamente';
  button.addEventListener('click', retry, { once: true });
  error.append(title, message, button);
  container.append(error);
  container.setAttribute('aria-busy', 'false');
  status.textContent = 'Falha ao carregar os documentos.';
}

export async function initTransparency() {
  const container = document.getElementById('documentos-transparencia');
  const status = document.getElementById('documentos-status');
  if (!container || !status) return;

  const load = async () => {
    container.setAttribute('aria-busy', 'true');
    status.textContent = 'Carregando documentos para consulta pública.';

    try {
      const sections = getVisibleSections(await loadTransparencyData());
      container.replaceChildren();

      if (sections.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'documentos-state';
        empty.textContent = 'Nenhum documento está publicado no momento.';
        container.append(empty);
        status.textContent = 'Nenhum documento publicado.';
      } else {
        sections.forEach(sectionData => container.append(createSection(sectionData)));
        const total = sections.reduce((sum, sectionData) => sum + sectionData.documentos.length, 0);
        status.textContent = `${total} documentos carregados em ${sections.length} seções.`;
      }

      container.setAttribute('aria-busy', 'false');
    } catch (error) {
      console.error('Falha ao carregar os documentos de transparência:', error);
      renderError(container, status, load);
    }
  };

  await load();
}

if (typeof document !== 'undefined') initTransparency();
