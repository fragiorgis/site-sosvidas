const SITE_ROOT = new URL('../', import.meta.url);
const isLocalImage = value => typeof value === 'string' && /^\/img\/instagram\/[a-z0-9-]+\.(?:jpe?g|webp|png)$/.test(value);

export function selectPosts(data, mode = 'todos') {
  if (!data || !Array.isArray(data.posts)) throw new TypeError('Catálogo de atualizações inválido.');
  return data.posts.filter(post => {
    if (post.publicado !== true || (mode === 'destaques' && post.destaque !== true)) return false;
    if (!['titulo', 'resumo', 'alt', 'categoria'].every(key => typeof post[key] === 'string' && post[key].trim())) return false;
    if (!isLocalImage(post.imagem)) return false;
    if (!/^https:\/\/www\.instagram\.com\/sos_vidass\/(?:p|reel)\/[A-Za-z0-9_-]+\/$/.test(post.url)) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.data) || !Number.isFinite(Date.parse(post.data))) return false;
    return new Date(`${post.data}T12:00:00Z`).toISOString().slice(0, 10) === post.data;
  }).sort((a, b) => b.data.localeCompare(a.data)).slice(0, mode === 'destaques' ? 3 : 60)
    .map(post => mode === 'destaques' && isLocalImage(post.imagemInicio) && typeof post.altInicio === 'string' && post.altInicio.trim()
      ? { ...post, imagem: post.imagemInicio, alt: post.altInicio }
      : post);
}

export function createPost(post, doc = document) {
  const article = doc.createElement('article');
  article.className = 'update-post';
  const link = doc.createElement('a');
  link.className = 'update-link';
  link.href = post.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `${post.titulo} — abrir publicação no Instagram (nova aba)`);
  const image = doc.createElement('img');
  image.src = new URL(post.imagem.slice(1), SITE_ROOT).href;
  image.alt = post.alt;
  image.loading = 'lazy';
  image.decoding = 'async';
  image.width = 640;
  image.height = 640;
  image.addEventListener('error', () => { image.hidden = true; }, { once: true });
  const meta = doc.createElement('p');
  meta.className = 'update-meta';
  const category = doc.createElement('span');
  category.textContent = post.categoria;
  const time = doc.createElement('time');
  time.dateTime = post.data;
  time.textContent = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${post.data}T12:00:00Z`));
  meta.append(category, time);
  const title = doc.createElement('h3');
  title.textContent = post.titulo;
  const description = doc.createElement('p');
  description.className = 'update-description';
  description.textContent = post.resumo;
  const cta = doc.createElement('span');
  cta.className = 'update-cta';
  cta.textContent = post.url.includes('/reel/') ? 'Assistir no Instagram' : 'Ver publicação no Instagram';
  link.append(image, meta, title, description, cta);
  article.append(link);
  return article;
}

export async function renderUpdates(grid) {
  const status = grid.parentElement.querySelector('.updates-status');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(new URL('data/atualizacoes.json', SITE_ROOT), { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) throw new Error('Não foi possível carregar as atualizações.');
    const posts = selectPosts(await response.json(), grid.dataset.updates);
    grid.replaceChildren(...posts.map(post => createPost(post)));
    status.textContent = posts.length ? '' : 'Novos registros serão selecionados em breve. Acompanhe também nosso Instagram.';
    status.hidden = posts.length > 0;
  } catch {
    status.textContent = 'Não foi possível carregar os registros agora. Você pode acompanhar as publicações pelo link do Instagram acima.';
  } finally {
    clearTimeout(timeout);
    grid.setAttribute('aria-busy', 'false');
  }
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-updates]').forEach(renderUpdates);
}
