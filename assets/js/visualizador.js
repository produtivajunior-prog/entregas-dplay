/* Visualizador de documentos: abre PDFs, imagens e páginas HTML numa janela sobre o site.
   PDFs são desenhados com o PDF.js (mesma biblioteca do Firefox), então o resultado é igual em qualquer navegador e no celular. */
(() => {
  'use strict';

  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';
  const PDFJS_SRI = 'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e';
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const LARGURA_MAX_PAGINA = 960; // largura de uma página no "ajustar", em px

  const icone = (caminho) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${caminho}</svg>`;
  const ICONES = {
    fechar: icone('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>'),
    mais: icone('<path d="M5 12h14"/><path d="M12 5v14"/>'),
    menos: icone('<path d="M5 12h14"/>'),
    baixar: icone('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'),
    abrir: icone('<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>'),
  };

  let dialogo = null;
  let sessao = 0;            // identifica a abertura atual (evita desenhar um documento antigo)
  let pdfjsPromessa = null;
  let estado = null;         // { tipo, zoom, paginas, doc, observador, ... }
  let elementoAnterior = null;

  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function carregarPdfjs() {
    if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
    if (!pdfjsPromessa) {
      pdfjsPromessa = new Promise((resolver, rejeitar) => {
        const s = document.createElement('script');
        s.src = `${PDFJS}/pdf.min.js`;
        s.integrity = PDFJS_SRI;
        s.crossOrigin = 'anonymous';
        s.onload = () => {
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = `${PDFJS}/pdf.worker.min.js`;
          resolver(window.pdfjsLib);
        };
        s.onerror = () => { pdfjsPromessa = null; rejeitar(new Error('Não foi possível carregar o leitor de PDF.')); };
        document.head.append(s);
      });
    }
    return pdfjsPromessa;
  }

  function criarDialogo() {
    dialogo = el(`
      <dialog class="vis" aria-labelledby="vis-titulo">
        <header class="vis__barra">
          <div class="vis__titulo">
            <span class="vis__tipo"></span>
            <strong id="vis-titulo"></strong>
          </div>
          <div class="vis__controles">
            <span class="vis__pagina" aria-live="polite"></span>
            <div class="vis__zoom" role="group" aria-label="Zoom">
              <button type="button" data-vis="menos" aria-label="Diminuir o zoom" title="Diminuir (−)">${ICONES.menos}</button>
              <button type="button" data-vis="ajustar" class="vis__zoom-valor" title="Ajustar à largura (0)">100%</button>
              <button type="button" data-vis="mais" aria-label="Aumentar o zoom" title="Aumentar (+)">${ICONES.mais}</button>
            </div>
            <a class="vis__acao vis__acao--nova" target="_blank" rel="noopener" title="Abrir em uma nova aba">${ICONES.abrir}<span>Nova aba</span></a>
            <a class="vis__acao vis__acao--baixar" title="Baixar o arquivo">${ICONES.baixar}<span>Baixar</span></a>
            <button type="button" data-vis="fechar" class="vis__fechar" aria-label="Fechar o visualizador" title="Fechar (Esc)">${ICONES.fechar}</button>
          </div>
        </header>
        <div class="vis__corpo" tabindex="0"><div class="vis__conteudo"></div></div>
      </dialog>`);
    document.body.append(dialogo);

    dialogo.addEventListener('click', (e) => {
      const botao = e.target.closest('[data-vis]');
      if (botao) {
        const acao = botao.dataset.vis;
        if (acao === 'fechar') dialogo.close();
        else if (acao === 'mais') mudarZoom(+0.25);
        else if (acao === 'menos') mudarZoom(-0.25);
        else if (acao === 'ajustar') definirZoom(1);
      } else if (e.target === dialogo) {
        dialogo.close(); // clique no fundo escuro
      }
    });
    dialogo.addEventListener('close', aoFechar);
    dialogo.addEventListener('keydown', (e) => {
      if (!estado || estado.tipo === 'html') return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); mudarZoom(+0.25); }
      else if (e.key === '-') { e.preventDefault(); mudarZoom(-0.25); }
      else if (e.key === '0') { e.preventDefault(); definirZoom(1); }
    });
    window.addEventListener('resize', () => { if (dialogo.open && estado && estado.tipo !== 'html') reposicionar(); });
  }

  function aoFechar() {
    sessao++;
    document.documentElement.classList.remove('vis-aberto');
    if (estado) {
      if (estado.observador) estado.observador.disconnect();
      if (estado.doc) estado.doc.destroy();
    }
    estado = null;
    dialogo.querySelector('.vis__conteudo').replaceChildren();
    if (elementoAnterior && document.contains(elementoAnterior)) elementoAnterior.focus({ preventScroll: true });
  }

  const larguraBase = () => {
    const corpo = dialogo.querySelector('.vis__corpo');
    const livre = corpo.clientWidth - (corpo.clientWidth < 600 ? 16 : 48);
    return Math.max(220, Math.min(LARGURA_MAX_PAGINA, livre));
  };

  function atualizarZoomTexto() {
    dialogo.querySelector('.vis__zoom-valor').textContent = `${Math.round(estado.zoom * 100)}%`;
  }

  function mudarZoom(delta) { definirZoom(Math.round((estado.zoom + delta) * 100) / 100); }

  function definirZoom(valor) {
    if (!estado || estado.tipo === 'html') return;
    estado.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, valor));
    atualizarZoomTexto();
    reposicionar();
  }

  /* ---------- PDF ---------- */
  async function abrirPdf(url, minhaSessao) {
    const conteudo = dialogo.querySelector('.vis__conteudo');
    conteudo.innerHTML = '<div class="vis__estado"><span class="vis__spinner" aria-hidden="true"></span>Carregando documento…</div>';
    const pdfjs = await carregarPdfjs();
    if (minhaSessao !== sessao) return;
    const doc = await pdfjs.getDocument({ url }).promise;
    if (minhaSessao !== sessao) { doc.destroy(); return; }

    const paginas = [];
    for (let i = 1; i <= doc.numPages; i++) paginas.push(await doc.getPage(i));
    if (minhaSessao !== sessao) { doc.destroy(); return; }

    estado.doc = doc;
    estado.paginas = paginas;
    conteudo.replaceChildren();

    estado.caixas = paginas.map((pagina, i) => {
      const caixa = el(`<div class="vis__pagina-caixa" data-n="${i + 1}"><canvas></canvas></div>`);
      conteudo.append(caixa);
      return caixa;
    });

    estado.observador = new IntersectionObserver((entradas) => {
      entradas.forEach((entrada) => { if (entrada.isIntersecting) desenharPagina(Number(entrada.target.dataset.n) - 1, minhaSessao); });
    }, { root: dialogo.querySelector('.vis__corpo'), rootMargin: '800px 0px' });

    reposicionar();
    dialogo.querySelector('.vis__corpo').addEventListener('scroll', atualizarNumeroPagina, { passive: true });
    atualizarNumeroPagina();
  }

  function reposicionar() {
    if (estado.tipo === 'imagem') {
      const img = dialogo.querySelector('.vis__imagem');
      if (img && img.naturalWidth) img.style.width = `${Math.round(larguraBase() * estado.zoom)}px`;
      return;
    }
    const largura = larguraBase() * estado.zoom;
    estado.paginas.forEach((pagina, i) => {
      const vista = pagina.getViewport({ scale: 1 });
      const caixa = estado.caixas[i];
      caixa.style.width = `${Math.round(largura)}px`;
      caixa.style.height = `${Math.round((largura * vista.height) / vista.width)}px`;
      caixa.dataset.pronta = '';
      estado.observador.unobserve(caixa);
      estado.observador.observe(caixa);
    });
    atualizarNumeroPagina();
  }

  async function desenharPagina(indice, minhaSessao) {
    const caixa = estado && estado.caixas[indice];
    if (!caixa || caixa.dataset.pronta === 'sim') return;
    const larguraAlvo = parseFloat(caixa.style.width);
    if (caixa.dataset.pronta === String(larguraAlvo)) return;
    caixa.dataset.pronta = String(larguraAlvo); // evita desenhar duas vezes ao mesmo tempo

    const pagina = estado.paginas[indice];
    const base = pagina.getViewport({ scale: 1 });
    const escala = larguraAlvo / base.width;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const vista = pagina.getViewport({ scale: escala * dpr });

    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(vista.width);
    canvas.height = Math.floor(vista.height);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    await pagina.render({ canvasContext: canvas.getContext('2d'), viewport: vista }).promise;
    if (minhaSessao !== sessao || !estado) return;
    caixa.replaceChildren(canvas);
  }

  function atualizarNumeroPagina() {
    if (!estado || !estado.caixas) return;
    const corpo = dialogo.querySelector('.vis__corpo');
    const topo = corpo.getBoundingClientRect().top;
    let atual = 0;
    estado.caixas.forEach((caixa, i) => { if (caixa.getBoundingClientRect().top - topo < corpo.clientHeight * 0.4) atual = i; });
    dialogo.querySelector('.vis__pagina').textContent = `${atual + 1} / ${estado.caixas.length}`;
  }

  /* ---------- Imagem e página web ---------- */
  function abrirImagem(url, titulo) {
    const conteudo = dialogo.querySelector('.vis__conteudo');
    conteudo.innerHTML = `<img class="vis__imagem" alt="${esc(titulo)}">`;
    const img = conteudo.firstElementChild;
    img.addEventListener('load', reposicionar, { once: true });
    img.src = url;
  }

  function abrirHtml(url, titulo) {
    dialogo.querySelector('.vis__conteudo').innerHTML = `<iframe class="vis__quadro" title="${esc(titulo)}" src="${esc(url)}"></iframe>`;
  }

  /* ---------- Abrir ---------- */
  function abrir({ url, titulo, nome }) {
    if (!dialogo) criarDialogo();
    elementoAnterior = document.activeElement;
    const extensao = (nome || url).split('?')[0].split('.').pop().toLowerCase();
    const tipo = extensao === 'pdf' ? 'pdf' : ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(extensao) ? 'imagem' : 'html';

    if (estado) aoFechar();
    const minhaSessao = ++sessao;
    estado = { tipo, zoom: 1, doc: null, paginas: [], caixas: [], observador: null };

    dialogo.dataset.tipo = tipo;
    dialogo.querySelector('#vis-titulo').textContent = titulo;
    dialogo.querySelector('.vis__tipo').textContent = tipo === 'pdf' ? 'PDF' : tipo === 'imagem' ? 'Imagem' : 'Página';
    dialogo.querySelector('.vis__pagina').textContent = '';
    const nova = dialogo.querySelector('.vis__acao--nova');
    nova.href = url;
    const baixar = dialogo.querySelector('.vis__acao--baixar');
    baixar.href = url;
    baixar.setAttribute('download', nome || '');
    atualizarZoomTexto();
    dialogo.querySelector('.vis__corpo').scrollTop = 0;

    document.documentElement.classList.add('vis-aberto');
    dialogo.showModal();
    dialogo.querySelector('.vis__corpo').focus({ preventScroll: true });

    const falha = (erro) => {
      if (minhaSessao !== sessao) return;
      console.error(erro);
      dialogo.querySelector('.vis__conteudo').innerHTML =
        `<div class="vis__estado vis__estado--erro"><p>Não foi possível mostrar o documento aqui.</p><a class="botao botao--cheio" href="${esc(url)}" target="_blank" rel="noopener">Abrir em uma nova aba</a></div>`;
    };

    if (tipo === 'pdf') abrirPdf(url, minhaSessao).catch(falha);
    else if (tipo === 'imagem') abrirImagem(url, titulo);
    else abrirHtml(url, titulo);
  }

  window.Visualizador = { abrir };
})();
