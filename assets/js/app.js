(() => {
  'use strict';

  const principal = document.getElementById('principal');
  const nav = document.getElementById('nav');

  const estado = { setores: [], indice: { setores: {} }, upload: false, busca: '', abertas: new Set(), editar: false, porChave: new Map() };

  /* ---------- Ícones (traço, estilo Lucide) ---------- */
  const ICONES = {
    carrinho: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
    foguete: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
    maleta: '<rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    suporte: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/>',
    caixa: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    aprovar: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    relogio: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    usuarios: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    robo: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
    escudo: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    painel: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    historico: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
    pedido: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
    pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    grafico: '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/>',
    casa: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    fluxo: '<rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/>',
    baixo: '<path d="m6 9 6 6 6-6"/>',
    seta: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    voltar: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    abrir: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',
    enviar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
    busca: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    pasta: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    lapis: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
    arquivo: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/>',
    megafone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    coracao: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
    whatsapp: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  };
  const svg = (nome) =>
    `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONES[nome] || ICONES.arquivo}</svg>`;

  /* ---------- Utilidades ---------- */
  const esc = (texto) =>
    String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;

  const formatarTamanho = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    const unidades = ['KB', 'MB', 'GB'];
    let valor = bytes / 1024;
    let i = 0;
    while (valor >= 1024 && i < unidades.length - 1) { valor /= 1024; i++; }
    return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: valor < 10 ? 1 : 0 })} ${unidades[i]}`;
  };

  // Título mostrado na lista: o título definido, ou o nome do arquivo sem a extensão (.pdf, .html).
  const tituloExibido = (a) => a.titulo || a.nome.replace(/\.(pdf|html?)$/i, '').trim();

  // "PDF", "Página web"… para a linha de detalhes (a extensão sai do título)
  const tipoDoArquivo = (nome) => {
    const e = extensao(nome);
    return e === 'html' || e === 'htm' ? 'Página web' : (e || 'Arquivo').toUpperCase();
  };

  const extensao = (nome) => (nome.includes('.') ? nome.split('.').pop().toLowerCase() : '');
  const ehImagem = (nome) => ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extensao(nome));

  const caminhoDoArquivo = (setor, arquivo) =>
    ['entregas', setor, ...(arquivo.grupo ? arquivo.grupo.split('/') : []), arquivo.nome].map(encodeURIComponent).join('/');

  // tipo "extra" em setores.json = entrega à parte (não conta como setor)
  const ehSetor = (s) => s.tipo !== 'extra';
  const arquivosDo = (id) => estado.indice.setores[id] || [];
  const contarArquivos = (lista) => lista.reduce((n, a) => n + 1 + (a.anexos ? a.anexos.length : 0), 0);
  const setorPorId = (id) => estado.setores.find((s) => s.id === id);

  /* ---------- Dados ---------- */
  async function buscarJson(url) {
    const resposta = await fetch(url, { cache: 'no-store' });
    if (!resposta.ok) throw new Error(`${url}: ${resposta.status}`);
    return resposta.json();
  }

  async function carregarIndice() {
    try {
      estado.indice = await buscarJson('entregas.json');
    } catch {
      estado.indice = { setores: {} };
    }
  }

  async function detectarUpload() {
    try {
      const status = await buscarJson('api/status');
      estado.upload = status.upload === true;
      estado.editar = status.editar === true;
    } catch { estado.upload = false; estado.editar = false; }
  }

  /* ---------- Navegação ---------- */
  // A frase ao lado do logo só aparece se o menu couber inteiro.
  function ajustarTopo() {
    const topo = document.querySelector('.topo');
    topo.classList.remove('topo--sem-lema');
    if (nav.scrollWidth > nav.clientWidth + 1) topo.classList.add('topo--sem-lema');
  }
  window.addEventListener('resize', ajustarTopo);
  if (document.fonts) document.fonts.ready.then(ajustarTopo);

  function renderNav(atual) {
    nav.innerHTML = estado.setores
      .map((s) => `<a href="#/${esc(s.id)}"${s.id === atual ? ' aria-current="page"' : ''}>${esc(s.nomeCurto || s.nome)}</a>`)
      .join('');
    ajustarTopo();
  }

  const IMPACTO_SETORES = {
    processo: 'O processo comercial que existia (AS IS) foi mapeado e redesenhado (TO BE) em 10 etapas, do lead ao relacionamento depois da entrega. O novo fluxo registra tudo no CRM, cria uma sequência de mensagens para quem não responde e liga o diagnóstico à proposta.',
    prospeccao: 'O time comercial ganhou um roteiro de ligação em seis etapas, quatro mensagens de follow-up pelo WhatsApp, respostas para 34 objeções e um treinamento sobre qualificação (BANT e SPIN), negociação e tráfego pago.',
    marketing: 'Dez segmentos analisados, cada um com o motivo do interesse, a forma de abordar e ideias de marketing, e canais de tração organizados pelo Bullseye Framework, de SEO e conteúdo a indicações e eventos. A apresentação institucional 2026 padroniza como a DPlay se mostra ao mercado.',
    crm: 'O CRM reúne leads, cadência com mensagens automáticas, ferramentas comerciais e pesquisas de satisfação, com dashboard para o administrador. O manual ensina cada tela, e o prompt do time de agentes de IA amplia a capacidade de prospecção.',
    sucesso: 'A satisfação passa a ser medida com CSAT nas entregas e NPS no encerramento. Os modelos de reunião, em PDF e em versão editável, já trazem as perguntas, o plano de indicações e o espaço para feedback.',
  };

  const cartaoImpacto = (s) => `
    <li class="impacto">
      <div class="impacto__topo">
        <span class="impacto__icone">${svg(s.icone)}</span>
        <h4>${esc(s.nomeCurto || s.nome)}</h4>
        <span class="impacto__contagem">${plural(contarArquivos(arquivosDo(s.id)), 'entrega', 'entregas')}</span>
      </div>
      <p>${esc(IMPACTO_SETORES[s.id] || s.descricao)}</p>
      <a href="#/${esc(s.id)}">Ver entregas ${svg('seta')}</a>
    </li>`;

  /* ---------- Apresentação da Produtiva ---------- */
  function blocoProdutiva() {
    const todos = estado.setores.flatMap((s) => arquivosDo(s.id));
    const documentos = contarArquivos(todos);
    const setoresComEntrega = estado.setores.filter((s) => ehSetor(s) && arquivosDo(s.id).length).length;
    const fluxogramas = todos.reduce((n, a) => n + (a.anexos || []).filter((x) => x.grupo === 'Mapeamentos').length, 0);
    const sistemas = estado.setores.filter((s) => s.destaque).length;
    const numero = (n, um, varios) => `<li><strong>${n}</strong> ${n === 1 ? um : varios}</li>`;

    return `
      <section class="produtiva conteudo" aria-labelledby="produtiva-titulo">
        <div class="produtiva__cartao">
          <div class="produtiva__apresentacao">
            <img class="produtiva__logo" src="assets/img/produtiva.png" alt="Símbolo da Produtiva" width="72" height="72">
            <div>
              <p class="eyebrow eyebrow--produtiva">Quem realiza este projeto</p>
              <h2 id="produtiva-titulo">Produtiva Júnior</h2>
              <p class="produtiva__texto">Empresa júnior de Engenharia de Produção da UFRN, fundada em 2009. Há mais de 15 anos atua em consultoria empresarial e assessoria estratégica, unindo conhecimento acadêmico e prática de mercado. Já impactou mais de 500 empresas.</p>
              <a class="produtiva__link" href="https://produtivajunior.com.br" target="_blank" rel="noopener">Conheça a Produtiva ${svg('seta')}</a>
            </div>
          </div>
          <div class="produtiva__bloco">
            <h3>Como trabalhamos</h3>
            <ul class="produtiva__itens produtiva__itens--tres">
              <li><strong>Projetos personalizados.</strong> Partimos da realidade da DPlay, não de um modelo pronto.</li>
              <li><strong>Mapeamento de processos.</strong> Registramos como o trabalho acontece, etapa por etapa, em fluxogramas BPMN.</li>
              <li><strong>Acompanhamento contínuo.</strong> As soluções continuam sendo acompanhadas depois de entregues.</li>
            </ul>
          </div>
          <div class="produtiva__bloco">
            <h3>Como impactamos o projeto</h3>
            <ul class="produtiva__itens produtiva__itens--cartoes">
              <li><strong>Um processo comercial desenhado.</strong> A jornada e os fluxogramas mostram cada etapa, do primeiro contato ao pós-venda, e o que muda em relação ao processo anterior.</li>
              <li><strong>Abordagem padronizada, sem perder o tom consultivo.</strong> Roteiro de ligação, mensagens de follow-up e respostas para 34 objeções dão segurança a quem vende.</li>
              <li><strong>Foco onde há mais chance de venda.</strong> O relatório por segmento, os canais de tração e o perfil do cliente ideal orientam a prospecção e o marketing.</li>
              <li><strong>Tudo registrado no CRM.</strong> Leads, cadência, ferramentas comerciais e pesquisas ficam no mesmo sistema, com indicadores para decidir.</li>
              <li><strong>Satisfação medida e transformada em indicação.</strong> CSAT, NPS e modelos de reunião com plano de indicações fecham o ciclo com o cliente.</li>
            </ul>
          </div>
          <details class="produtiva__setores">
            <summary><span>Ver o impacto frente por frente</span>${svg('baixo')}</summary>
            <ul class="impactos">${estado.setores.filter(ehSetor).map(cartaoImpacto).join('')}</ul>
            ${estado.setores.some((s) => !ehSetor(s)) ? `<h4 class="impactos__titulo">Além das frentes</h4><ul class="impactos">${estado.setores.filter((s) => !ehSetor(s)).map(cartaoImpacto).join('')}</ul>` : ''}
          </details>
          <ul class="produtiva__numeros" aria-label="Entregas da Produtiva neste projeto">
            ${numero(documentos, 'entrega publicada', 'entregas publicadas')}
            ${numero(setoresComEntrega, 'frente com entregas', 'frentes com entregas')}
            ${numero(fluxogramas, 'fluxograma BPMN', 'fluxogramas BPMN')}
            ${sistemas ? numero(sistemas, 'sistema desenvolvido', 'sistemas desenvolvidos') : ''}
          </ul>
        </div>
      </section>`;
  }

  /* ---------- Página: CRM DPlay Solutions (frente CRM e Automação) ---------- */
  const SISTEMA_CRM_URL = 'https://dplaystaff.cloud';
  const SISTEMA_CRM_HOST = 'dplaystaff.cloud';

  const RECURSOS_CRM = [
    { icone: 'painel', titulo: 'Quadros Kanban', texto: 'Cada lead é um cartão que avança pelas colunas do processo comercial. Fica fácil ver em que etapa está cada oportunidade.' },
    { icone: 'relogio', titulo: 'Fluxo de cadência', texto: 'Mostra quem ainda não respondeu e em que mensagem está, e envia mensagens automáticas para agendar a reunião de diagnóstico.' },
    { icone: 'pedido', titulo: 'Ferramentas comerciais', texto: 'Roteiro de abordagem, matriz de objeções e modelos de mensagem dentro do sistema, à mão durante a conversa.' },
    { icone: 'usuarios', titulo: 'Banco de leads', texto: 'Todos os contatos em um só lugar, com busca, filtros e importação de listas.' },
    { icone: 'coracao', titulo: 'Pesquisas de satisfação', texto: 'Média das avaliações, NPS e comentários dos clientes, ligados ao processo de Sucesso do Cliente.' },
    { icone: 'grafico', titulo: 'Dashboard e gráficos', texto: 'Indicadores de leads e NPS, faturamento, ticket médio, leads por mês e desempenho de cada pessoa da equipe.' },
    { icone: 'robo', titulo: 'Agente de IA', texto: 'Um assistente de inteligência artificial integrado ao sistema apoia a equipe no dia a dia.' },
    { icone: 'escudo', titulo: 'Acesso por perfil', texto: 'Cada pessoa entra com a própria conta. Administradores e equipe veem o que corresponde ao seu papel.' },
  ];

  const ETAPAS_LEAD = [
    { titulo: 'Registrar', texto: 'O lead entra no CRM com a origem do contato: indicação, evento, parceria ou canais online.' },
    { titulo: 'Abordar e acompanhar', texto: 'O contato é feito por ligação ou WhatsApp. Quem não responde segue o fluxo de cadência, com até quatro mensagens.' },
    { titulo: 'Diagnosticar e propor', texto: 'Reunião de diagnóstico, escopo, preço e proposta, com o CRM atualizado a cada passo.' },
    { titulo: 'Fechar e medir', texto: 'Contrato assinado, entrega acompanhada e a pesquisa de satisfação registrada no sistema.' },
  ];

  // Sem print do sistema: uma janela com a marca e o endereço de acesso.
  const janelaCrm = (classe = 'janela') => `
    <figure class="${classe}">
      <div class="janela__barra" aria-hidden="true"><i></i><i></i><i></i><span>${SISTEMA_CRM_HOST}</span></div>
      <div class="janela__marca">
        <img src="assets/img/dplay-globo.png" alt="" width="96" height="96">
        <strong>DPlay <span>Solutions</span></strong>
        <small>CRM · acesso da equipe</small>
        <span class="janela__entrar">Entrar</span>
      </div>
    </figure>`;

  function renderSistemaCrm(setor) {
    const recursos = RECURSOS_CRM.map((r) => `
      <li class="recurso">
        <span class="recurso__icone">${svg(r.icone)}</span>
        <h3>${esc(r.titulo)}</h3>
        <p>${esc(r.texto)}</p>
      </li>`).join('');
    const etapas = ETAPAS_LEAD.map((e, i) => `
      <li class="etapa">
        <span class="etapa__numero">${i + 1}</span>
        <h3>${esc(e.titulo)}</h3>
        <p>${esc(e.texto)}</p>
      </li>`).join('');

    principal.innerHTML = `
      <section class="sistema-topo">
        <div class="conteudo sistema-topo__grade">
          <div class="sistema-topo__texto">
            <a class="voltar" href="#/${esc(setor.id)}">${svg('voltar')} Voltar para ${esc(setor.nome)}</a>
            <p class="eyebrow">CRM e Automação · Sistema interno</p>
            <h1>CRM DPlay Solutions</h1>
            <p class="sistema-topo__lead">Um único sistema para <strong>acompanhar cada lead</strong>, do primeiro contato ao contrato, e <strong>medir a satisfação</strong> de quem já é cliente.</p>
            <div class="sistema-topo__acoes">
              <a class="botao botao--cheio botao--grande" href="${SISTEMA_CRM_URL}" target="_blank" rel="noopener">Acessar o CRM ${svg('abrir')}</a>
              <span class="sistema-topo__selo"><img src="assets/img/produtiva.png" alt="" width="28" height="28"> Desenvolvido pela Produtiva</span>
            </div>
          </div>
          ${janelaCrm()}
        </div>
      </section>

      <div class="conteudo sistema-corpo">
        <section aria-labelledby="sis-antes">
          <h2 id="sis-antes" class="secao-titulo">Da conversa solta ao funil registrado</h2>
          <div class="comparativo">
            <div class="comparativo__lado">
              <h3>Antes</h3>
              <ul>
                <li>Contatos sem registro em um sistema único.</li>
                <li>Sem uma sequência definida para quem não respondia.</li>
                <li>Sem indicadores de funil e de satisfação.</li>
              </ul>
            </div>
            <div class="comparativo__lado comparativo__lado--depois">
              <h3>Com o CRM</h3>
              <ul>
                <li>Todos os leads no mesmo lugar, em quadros por etapa.</li>
                <li>Cadência com mensagens automáticas para quem não respondeu.</li>
                <li>Dashboard, gráficos e NPS para acompanhar o resultado.</li>
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="sis-recursos">
          <h2 id="sis-recursos" class="secao-titulo">O que o CRM oferece</h2>
          <ul class="recursos">${recursos}</ul>
        </section>

        <section aria-labelledby="sis-fluxo">
          <h2 id="sis-fluxo" class="secao-titulo">Como um lead percorre o CRM</h2>
          <ol class="etapas">${etapas}</ol>
          <p class="sistema-nota">O caminho segue o processo comercial proposto (TO BE), na frente Processo Comercial. O passo a passo de cada tela está no Manual de Utilização do CRM.</p>
        </section>

        <section class="sistema-cta">
          <div>
            <h2>Pronto para usar?</h2>
            <p>O acesso é feito com o e-mail e a senha criados pelo administrador do CRM.</p>
          </div>
          <a class="botao botao--cheio botao--grande" href="${SISTEMA_CRM_URL}" target="_blank" rel="noopener">Acessar o CRM ${svg('abrir')}</a>
        </section>
      </div>`;
  }

  const PAGINAS = { sistema: renderSistemaCrm };

  /* ---------- Início ---------- */
  function renderInicio() {
    const total = estado.setores.reduce((n, s) => n + contarArquivos(arquivosDo(s.id)), 0);

    const montarCartoes = (lista) => lista.map((s, i) => {
      const n = contarArquivos(arquivosDo(s.id));
      return `
        <li style="--i:${i}">
          <a class="cartao" href="#/${esc(s.id)}">
            <span class="cartao__icone">${svg(s.icone)}</span>
            <h3>${esc(s.nome)}</h3>
            <p>${esc(s.descricao)}</p>
            <span class="cartao__rodape">
              <span class="contagem${n ? '' : ' contagem--vazio'}">${n ? plural(n, 'arquivo', 'arquivos') : 'Nenhum arquivo ainda'}</span>
              <span class="cartao__seta">${svg('seta')}</span>
            </span>
          </a>
        </li>`;
    }).join('');
    const cartoes = montarCartoes(estado.setores.filter(ehSetor));
    const extras = estado.setores.filter((s) => !ehSetor(s));
    const frentes = estado.setores.filter(ehSetor).length;
    const sistemas = estado.setores.filter((s) => s.destaque).length;

    principal.innerHTML = `
      <section class="hero">
        <div class="conteudo hero__grade">
          <div class="hero__texto">
            <p class="eyebrow">Projeto DPlay Solutions · Estruturação Comercial</p>
            <h1>Entregas do projeto<span>.</span></h1>
            <p class="hero__lead">Processo comercial, roteiros de venda, marketing, CRM e pesquisas de satisfação, organizados por frente.</p>
            <ul class="resumo">
              <li><strong>${frentes}</strong> ${frentes === 1 ? 'frente' : 'frentes'}</li>
              ${sistemas ? `<li><strong>${sistemas}</strong> ${sistemas === 1 ? 'sistema' : 'sistemas'}</li>` : ''}
              <li><strong>${total}</strong> ${total === 1 ? 'arquivo anexado' : 'arquivos anexados'}</li>
            </ul>
          </div>
          ${leque()}
        </div>
      </section>
      ${blocoProdutiva()}
      <div class="conteudo">
        <h2 class="secao-titulo">Escolha uma frente</h2>
        <ul class="grade">${cartoes}</ul>
        ${extras.length ? `<h2 class="secao-titulo">Além das frentes</h2><ul class="grade">${montarCartoes(extras)}</ul>` : ''}
      </div>`;
  }

  // Três capas em leque no topo da página inicial (o primeiro documento de cada frente escolhida).
  const FRENTES_LEQUE = ['prospeccao', 'processo', 'crm'];
  function leque() {
    const capas = FRENTES_LEQUE.map((id) => {
      const doc = [...arquivosDo(id)].sort((a, b) => (a.ordem ?? 1e6) - (b.ordem ?? 1e6)).find((a) => a.capa);
      return doc && { id, doc };
    }).filter(Boolean);
    if (capas.length < 3) return '';
    return `
      <div class="leque" aria-hidden="true">
        ${capas.map(({ id, doc }, i) => `
          <a class="leque__capa leque__capa--${i + 1}" href="#/${esc(id)}" tabindex="-1">
            <img src="${doc.capa.split('/').map(encodeURIComponent).join('/')}" alt="" width="480" height="680">
          </a>`).join('')}
      </div>`;
  }

  /* ---------- Setor ---------- */
  function renderSetor(setor) {
    const painelAnexar = estado.upload
      ? `<label class="anexar" id="anexar">
           ${svg('enviar')}
           <strong>Anexar arquivos</strong>
           <span>Arraste os arquivos para cá ou clique para escolher</span>
           <input type="file" id="campo-arquivo" multiple>
         </label>
         <ul class="envios" id="envios" aria-live="polite"></ul>`
      : ''; // site publicado: somente consulta

    principal.innerHTML = `
      <section class="setor-topo">
        <div class="conteudo">
          <a class="voltar" href="#/">${svg('voltar')} Todas as frentes</a>
          <div class="setor-titulo">
            <span class="cartao__icone">${svg(setor.icone)}</span>
            <div>
              <h1>${esc(setor.nome)}</h1>
              <p>${esc(setor.descricao)}</p>
            </div>
          </div>
        </div>
      </section>
      <div class="conteudo setor-corpo">
        ${setor.destaque ? bannerDestaque(setor) : ''}
        ${painelAnexar}
        <div class="ferramentas">
          <h2>Arquivos <small id="contagem"></small></h2>
          <label class="busca">
            ${svg('busca')}
            <input type="search" id="busca" placeholder="Buscar arquivo" aria-label="Buscar arquivo" value="${esc(estado.busca)}">
          </label>
        </div>
        <div id="lista"></div>
      </div>`;

    $('busca').addEventListener('input', (e) => { estado.busca = e.target.value; renderLista(setor); });
    if (estado.upload) ligarUpload(setor);
    renderLista(setor, true);
  }

  const $ = (id) => document.getElementById(id);

  function bannerDestaque(setor) {
    const d = setor.destaque;
    return `
      <a class="destaque" href="#/${esc(setor.id)}/${esc(d.rota)}">
        <div class="destaque__conteudo">
          <img class="destaque__selo" src="assets/img/produtiva.png" alt="" width="56" height="56">
          <div class="destaque__texto">
            <p class="eyebrow eyebrow--produtiva">Desenvolvido pela Produtiva</p>
            <h2>${esc(d.titulo)}</h2>
            <p>${esc(d.texto)}</p>
          </div>
          <span class="destaque__botao">${esc(d.botao)} ${svg('seta')}</span>
        </div>
        ${d.imagem
          ? `<span class="destaque__janela" aria-hidden="true"><i></i><i></i><i></i><img src="${esc(d.imagem)}" alt="" loading="lazy"></span>`
          : `<span class="destaque__janela destaque__janela--marca" aria-hidden="true"><i></i><i></i><i></i><span class="janela__marca janela__marca--mini"><img src="assets/img/dplay-globo.png" alt="" width="48" height="48"><strong>DPlay <span>Solutions</span></strong><small>CRM</small></span></span>`}
      </a>`;
  }

  function renderLista(setor, entrada = false) {
    const todos = arquivosDo(setor.id);
    const termo = estado.busca.trim().toLowerCase();
    const visiveis = todos
      .filter((a) => !termo || [a, ...(a.anexos || [])].some((x) => `${x.grupo} ${x.titulo || ''} ${x.nome} ${x.descricao || ''}`.toLowerCase().includes(termo)))
      .sort((a, b) => a.grupo.localeCompare(b.grupo, 'pt-BR') || (a.ordem ?? 1e6) - (b.ordem ?? 1e6) || new Date(b.modificado) - new Date(a.modificado));

    estado.porChave = new Map(todos.map((a) => [[setor.id, a.grupo, a.nome].filter(Boolean).join('/'), a]));
    const total = contarArquivos(todos);
    $('contagem').textContent = total ? `(${plural(total, 'arquivo', 'arquivos')})` : '';

    if (!visiveis.length) {
      $('lista').innerHTML = todos.length
        ? `<div class="vazio"><h3>Nada encontrado</h3><p>Nenhum arquivo corresponde a “${esc(estado.busca)}”.</p></div>`
        : `<div class="vazio">
             <div class="vazio__icone">${svg('arquivo')}</div>
             <h3>Nenhum arquivo anexado ainda</h3>
             <p>As entregas de ${esc(setor.nome)} vão aparecer aqui.</p>
           </div>`;
      return;
    }

    const grupos = new Map();
    visiveis.forEach((a) => grupos.set(a.grupo, [...(grupos.get(a.grupo) || []), a]));

    $('lista').innerHTML = [...grupos].map(([grupo, itens]) => `
      ${grupo ? `<h3 class="grupo-titulo">${svg('pasta')} ${esc(grupo.replace(/\//g, ' › '))}</h3>` : ''}
      <ul class="arquivos${entrada ? ' arquivos--entrada' : ''}">${itens.map((a, i) => linhaArquivo(setor, a, i)).join('')}</ul>`).join('');

    $('lista').querySelectorAll('.subguia__imagem img').forEach(ajustarMapa);
  }

  /* ---------- Subguias (anexos de um arquivo, ex.: mapeamento do processo) ---------- */
  function subguia(setor, x) {
    const url = caminhoDoArquivo(setor.id, x);
    const chave = url;
    const aberta = estado.abertas.has(chave);
    const painel = `sg-${[...chave].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)}`;
    // sem prévia gerada, uma imagem serve de prévia dela mesma
    const capa = x.capa ? x.capa.split('/').map(encodeURIComponent).join('/') : (ehImagem(x.nome) ? url : null);
    return `
      <div class="subguia${aberta ? ' subguia--aberta' : ''}">
        <button type="button" class="subguia__aba" aria-expanded="${aberta}" aria-controls="${painel}" data-chave="${esc(chave)}">
          ${svg('fluxo')}<span>${esc(x.rotulo || 'Anexo')}</span><span class="subguia__seta">${svg('baixo')}</span>
        </button>
        <div class="subguia__painel" id="${painel}"${aberta ? '' : ' hidden'}>
          <div class="subguia__topo">
            ${x.descricao ? `<p class="arquivo__desc">${esc(x.descricao)}</p>` : '<span></span>'}
            <div class="arquivo__acoes">
              <a class="botao" href="${url}" target="_blank" rel="noopener">${svg('abrir')} Abrir</a>
              <a class="botao botao--cheio" href="${url}" download="${esc(x.nome)}">${svg('baixar')} Baixar</a>
            </div>
          </div>
          ${capa ? `<button type="button" class="subguia__imagem" title="Clique para ampliar ou reduzir o desenho"><img src="${capa}" alt="Fluxograma: ${esc(x.nome)}" loading="lazy"></button>
          <p class="subguia__dica">Clique no desenho para ampliar ou reduzir. Use “Abrir” para ver o arquivo original.</p>` : ''}
        </div>
      </div>`;
  }

  // Mantém o desenho legível: cabe na largura disponível, mas nunca fica pequeno demais (nesse caso rola para o lado).
  function ajustarMapa(img) {
    const aplicar = () => {
      const caixa = img.parentElement.clientWidth;
      if (!caixa) return; // painel fechado
      const ampliado = img.parentElement.classList.contains('subguia__imagem--zoom');
      img.style.width = `${ampliado ? img.naturalWidth : Math.round(Math.max(img.naturalWidth * 0.4, Math.min(img.naturalWidth * 0.5, caixa)))}px`;
    };
    if (img.complete) aplicar(); else img.addEventListener('load', aplicar, { once: true });
  }

  // Abre PDFs, imagens e páginas dentro do site (Ctrl/Cmd+clique ou botão do meio ainda abrem em outra aba)
  function tituloDoLink(link) {
    const base = link.closest('.arquivo').querySelector('.arquivo__nome').textContent;
    const sub = link.closest('.subguia');
    return sub ? `${base} — ${sub.querySelector('.subguia__aba span').textContent}` : base;
  }

  document.addEventListener('click', (e) => {
    const link = e.target.closest('#lista a[target="_blank"]');
    if (link && window.Visualizador && e.button === 0 && !(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
        && /\.(pdf|png|jpe?g|webp|html?)$/i.test(new URL(link.href).pathname)) {
      e.preventDefault();
      const nome = decodeURIComponent(new URL(link.href).pathname.split('/').pop());
      window.Visualizador.abrir({ url: link.getAttribute('href'), titulo: tituloDoLink(link), nome });
      return;
    }
    const lapis = e.target.closest('.arquivo__editar');
    if (lapis) { abrirEdicao(lapis.dataset.chave); return; }
    const desenho = e.target.closest('.subguia__imagem');
    if (desenho) {
      desenho.classList.toggle('subguia__imagem--zoom');
      ajustarMapa(desenho.querySelector('img'));
      return;
    }
    const aba = e.target.closest('.subguia__aba');
    if (!aba) return;
    const abrir = aba.getAttribute('aria-expanded') !== 'true';
    aba.setAttribute('aria-expanded', String(abrir));
    aba.closest('.subguia').classList.toggle('subguia--aberta', abrir);
    const painel = document.getElementById(aba.getAttribute('aria-controls'));
    painel.hidden = !abrir;
    estado.abertas[abrir ? 'add' : 'delete'](aba.dataset.chave);
    if (abrir) painel.querySelectorAll('img').forEach(ajustarMapa);
  });

  function linhaArquivo(setor, a, i) {
    const url = caminhoDoArquivo(setor.id, a);
    const capa = a.capa ? a.capa.split('/').map(encodeURIComponent).join('/') : null;
    const marca = capa || ehImagem(a.nome)
      ? `<img src="${capa || url}" alt="" loading="lazy">`
      : esc((extensao(a.nome) || 'arq').slice(0, 4).toUpperCase());
    return `
      <li class="arquivo" style="--i:${Math.min(i, 12)}">
        <a class="arquivo__marca${capa ? ' arquivo__marca--capa' : ''}" href="${url}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">${marca}</a>
        <div class="arquivo__info">
          <div class="arquivo__linha">
            <a class="arquivo__nome" href="${url}" target="_blank" rel="noopener" title="${esc(a.nome)}">${esc(tituloExibido(a))}</a>
            ${estado.editar ? `<button type="button" class="arquivo__editar" data-chave="${esc([setor.id, a.grupo, a.nome].filter(Boolean).join('/'))}" aria-label="Editar título e descrição" title="Editar título e descrição">${svg('lapis')}</button>` : ''}
          </div>
          ${a.descricao ? `<p class="arquivo__desc">${esc(a.descricao)}</p>` : ''}
          <p class="arquivo__meta">${esc(tipoDoArquivo(a.nome))} · ${formatarTamanho(a.tamanho)}</p>
        </div>
        <div class="arquivo__acoes">
          <a class="botao" href="${url}" target="_blank" rel="noopener">${svg('abrir')} Abrir</a>
          <a class="botao botao--cheio" href="${url}" download="${esc(a.nome)}">${svg('baixar')} Baixar</a>
        </div>
        ${(a.anexos || []).map((x) => subguia(setor, x)).join('')}
      </li>`;
  }

  /* ---------- Edição de título e descrição (apenas com o servidor local) ---------- */
  function abrirEdicao(chave) {
    const item = estado.porChave.get(chave);
    if (!item) return;
    let dialogo = document.getElementById('dialogo-edicao');
    if (!dialogo) {
      dialogo = document.createElement('dialog');
      dialogo.id = 'dialogo-edicao';
      dialogo.className = 'dialogo';
      document.body.append(dialogo);
    }
    dialogo.innerHTML = `
      <form method="dialog" class="dialogo__form">
        <h2>Editar documento</h2>
        <label>Título exibido
          <input name="titulo" maxlength="200" value="${esc(item.titulo || '')}" placeholder="${esc(item.nome)}">
          <small>Deixe em branco para usar o nome do arquivo.</small>
        </label>
        <label>Descrição
          <textarea name="descricao" rows="6" maxlength="1500">${esc(item.descricao || '')}</textarea>
        </label>
        <p class="dialogo__erro" role="alert" hidden></p>
        <div class="dialogo__acoes">
          <button type="button" class="botao" data-acao="cancelar">Cancelar</button>
          <button type="submit" class="botao botao--cheio">Salvar</button>
        </div>
      </form>`;
    const form = dialogo.querySelector('form');
    const erro = dialogo.querySelector('.dialogo__erro');
    dialogo.querySelector('[data-acao="cancelar"]').addEventListener('click', () => dialogo.close());
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      erro.hidden = true;
      try {
        const resposta = await fetch('api/meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chave, titulo: form.titulo.value, descricao: form.descricao.value }),
        });
        if (!resposta.ok) throw new Error((await resposta.json().catch(() => ({}))).erro || 'Não foi possível salvar.');
        dialogo.close();
        await carregarIndice();
        const setor = setorPorId(location.hash.replace(/^#\/?/, ''));
        if (setor) renderLista(setor);
      } catch (falha) {
        erro.textContent = falha.message;
        erro.hidden = false;
      }
    });
    dialogo.showModal();
    form.titulo.focus();
  }

  /* ---------- Upload (apenas com o servidor local) ---------- */
  function ligarUpload(setor) {
    const zona = $('anexar');
    const campo = $('campo-arquivo');

    campo.addEventListener('change', () => { enviarVarios(setor, [...campo.files]); campo.value = ''; });
    ['dragenter', 'dragover'].forEach((tipo) =>
      zona.addEventListener(tipo, (e) => { e.preventDefault(); zona.classList.add('arrastando'); }));
    ['dragleave', 'drop'].forEach((tipo) =>
      zona.addEventListener(tipo, (e) => { e.preventDefault(); zona.classList.remove('arrastando'); }));
    zona.addEventListener('drop', (e) => enviarVarios(setor, [...e.dataTransfer.files]));
  }

  function enviarArquivo(setor, arquivo, aoProgredir) {
    return new Promise((resolve, reject) => {
      const x = new XMLHttpRequest();
      x.open('POST', `api/upload?setor=${encodeURIComponent(setor.id)}&nome=${encodeURIComponent(arquivo.name)}`);
      x.setRequestHeader('Content-Type', 'application/octet-stream');
      x.upload.onprogress = (e) => e.lengthComputable && aoProgredir(e.loaded / e.total);
      x.onload = () => {
        if (x.status === 200) return resolve();
        let msg = 'Falha no envio.';
        try { msg = JSON.parse(x.responseText).erro || msg; } catch { /* mantém a mensagem padrão */ }
        reject(new Error(msg));
      };
      x.onerror = () => reject(new Error('Sem conexão com o servidor.'));
      x.send(arquivo);
    });
  }

  async function enviarVarios(setor, arquivos) {
    const lista = $('envios');
    for (const arquivo of arquivos) {
      const item = document.createElement('li');
      item.className = 'envio';
      item.innerHTML = `
        <div class="envio__linha"><span class="envio__nome"></span><span class="envio__estado">0%</span></div>
        <progress max="1" value="0"></progress>`;
      item.querySelector('.envio__nome').textContent = arquivo.name;
      lista.append(item);

      const estadoEl = item.querySelector('.envio__estado');
      const barra = item.querySelector('progress');
      try {
        await enviarArquivo(setor, arquivo, (p) => { barra.value = p; estadoEl.textContent = `${Math.round(p * 100)}%`; });
        item.classList.add('envio--ok');
        estadoEl.textContent = 'Anexado';
        barra.remove();
      } catch (erro) {
        item.classList.add('envio--erro');
        estadoEl.textContent = erro.message;
        barra.remove();
      }
      await carregarIndice();
      if (location.hash === `#/${setor.id}`) renderLista(setor);
    }
  }

  /* ---------- Rotas ---------- */
  function renderizarRota() {
    const [id, sub] = location.hash.replace(/^#\/?/, '').split('/');
    const setor = setorPorId(id);
    if (setor && sub && setor.destaque && setor.destaque.rota === sub && PAGINAS[sub]) {
      renderNav(setor.id);
      PAGINAS[sub](setor);
      document.title = `${setor.destaque.titulo} · DPlay Entregas`;
      window.scrollTo(0, 0);
      return;
    }

    renderNav(setor ? setor.id : null);
    if (setor) {
      renderSetor(setor);
      document.title = `${setor.nome} · DPlay Entregas`;
    } else {
      estado.busca = '';
      renderInicio();
      document.title = 'DPlay Solutions · Entregas do Projeto';
    }
    window.scrollTo(0, 0);
  }

  /* ---------- Animações ---------- */
  const reduzMovimento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let primeiraRota = true;

  function rotear() {
    renderizarRota();
    if (!primeiraRota) principal.focus({ preventScroll: true });
    primeiraRota = false;
  }

  // Faíscas azuis ao clicar em links e botões (cores do globo da DPlay)
  function faiscas(x, y) {
    const cores = ['#31B7FF', '#057EF3'];
    for (let i = 0; i < 10; i++) {
      const ponto = document.createElement('span');
      ponto.className = 'faisca';
      ponto.style.cssText = `left:${x}px;top:${y}px;background:${cores[i % 2]}`;
      document.body.append(ponto);
      const angulo = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const distancia = 26 + Math.random() * 30;
      ponto.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(angulo) * distancia}px), calc(-50% + ${Math.sin(angulo) * distancia}px)) scale(.2)`, opacity: 0 },
      ], { duration: 520, easing: 'cubic-bezier(.2, .8, .3, 1)' }).finished.then(() => ponto.remove());
    }
  }

  document.addEventListener('pointerdown', (e) => {
    if (reduzMovimento.matches || !e.target.closest('a, button, label.anexar')) return;
    faiscas(e.clientX, e.clientY);
  });

  async function iniciar() {
    try {
      estado.setores = await buscarJson('setores.json');
    } catch {
      principal.innerHTML = '<div class="conteudo"><div class="vazio"><h3>Não foi possível carregar o site</h3><p>Abra o site pelo servidor: <code>node server.mjs</code></p></div></div>';
      return;
    }
    await Promise.all([carregarIndice(), detectarUpload()]);
    window.addEventListener('hashchange', rotear);
    rotear();
  }

  iniciar();
})();
