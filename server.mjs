// Servidor local do site de entregas (sem dependências). Uso: node server.mjs
// - serve o site e a pasta entregas/
// - monta a lista de arquivos a cada acesso (/entregas.json)
// - recebe anexos enviados pelo botão "Anexar" (/api/upload)
import http from 'node:http';
import path from 'node:path';
import { createReadStream, createWriteStream } from 'node:fs';
import { stat, unlink, readFile, writeFile, rename } from 'node:fs/promises';
import { gerarIndice, lerSetores, RAIZ } from './scripts/indice.mjs';

const PORTA = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const LIMITE_UPLOAD = 1024 ** 3; // 1 GB por arquivo
const PUBLICOS = new Set(['index.html', 'setores.json', 'favicon.png', 'favicon.ico', 'apple-touch-icon.png', 'assets', 'entregas', 'capas']);

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.csv': 'text/csv; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
};

function json(res, status, corpo) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(corpo));
}

function limparNome(nome) {
  const limpo = path.basename(String(nome)).replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '').trim().slice(0, 200);
  return limpo || 'arquivo';
}

async function existe(caminho) {
  try { await stat(caminho); return true; } catch { return false; }
}

async function nomeLivre(pasta, nome) {
  const { name, ext } = path.parse(nome);
  let candidato = nome;
  for (let n = 2; await existe(path.join(pasta, candidato)); n++) candidato = `${name} (${n})${ext}`;
  return candidato;
}

async function receberUpload(req, res, url) {
  const origem = req.headers.origin;
  if (origem && new URL(origem).host !== req.headers.host) return json(res, 403, { erro: 'Origem não permitida.' });

  const setor = url.searchParams.get('setor');
  if (!(await lerSetores()).some((s) => s.id === setor)) return json(res, 400, { erro: 'Setor inválido.' });

  const tamanho = Number(req.headers['content-length']);
  if (!tamanho) return json(res, 400, { erro: 'Arquivo vazio.' });
  if (tamanho > LIMITE_UPLOAD) return json(res, 413, { erro: 'Arquivo maior que 1 GB.' });

  const pasta = path.join(RAIZ, 'entregas', setor);
  const nome = await nomeLivre(pasta, limparNome(url.searchParams.get('nome')));
  const destino = path.join(pasta, nome);
  const saida = createWriteStream(destino, { flags: 'wx' });

  let falhou = false;
  const abortar = async () => {
    if (falhou) return;
    falhou = true;
    saida.destroy();
    await unlink(destino).catch(() => {});
  };
  req.on('aborted', abortar);
  req.on('error', abortar);
  saida.on('error', async () => { await abortar(); if (!res.headersSent) json(res, 500, { erro: 'Não foi possível salvar o arquivo.' }); });
  saida.on('finish', () => { if (!falhou) json(res, 200, { nome }); });
  req.pipe(saida);
}

function lerCorpo(req, limite = 50_000) {
  return new Promise((resolver, rejeitar) => {
    const partes = [];
    let total = 0;
    req.on('data', (parte) => {
      total += parte.length;
      if (total > limite) { rejeitar(new Error('Corpo grande demais.')); req.destroy(); } else partes.push(parte);
    });
    req.on('end', () => resolver(Buffer.concat(partes).toString('utf8')));
    req.on('error', rejeitar);
  });
}

// Salva o título e a descrição de um arquivo em descricoes.json
async function salvarMeta(req, res) {
  const origem = req.headers.origin;
  if (origem && new URL(origem).host !== req.headers.host) return json(res, 403, { erro: 'Origem não permitida.' });

  let dados;
  try { dados = JSON.parse(await lerCorpo(req)); } catch { return json(res, 400, { erro: 'Pedido inválido.' }); }
  const { chave, titulo, descricao } = dados || {};
  if (typeof chave !== 'string' || typeof titulo !== 'string' || typeof descricao !== 'string') return json(res, 400, { erro: 'Pedido inválido.' });
  if (titulo.length > 200 || descricao.length > 1500) return json(res, 400, { erro: 'Texto longo demais.' });

  // A chave precisa apontar para um arquivo que existe em entregas/<setor>/…
  const partes = chave.normalize('NFC').split('/');
  const pastaEntregas = path.join(RAIZ, 'entregas');
  const caminho = path.resolve(pastaEntregas, ...partes);
  const setorValido = (await lerSetores()).some((setor) => setor.id === partes[0]);
  const info = await stat(caminho).catch(() => null);
  if (!setorValido || !caminho.startsWith(pastaEntregas + path.sep) || !info?.isFile()) return json(res, 404, { erro: 'Arquivo não encontrado.' });

  const arquivo = path.join(RAIZ, 'descricoes.json');
  const tudo = JSON.parse(await readFile(arquivo, 'utf8').catch(() => '{}'));
  const chaveSalva = Object.keys(tudo).find((k) => k.normalize('NFC') === chave.normalize('NFC')) ?? chave.normalize('NFC');
  const atual = tudo[chaveSalva];
  const registro = typeof atual === 'string' ? { descricao: atual } : { ...(atual || {}) };

  if (titulo.trim()) registro.titulo = titulo.trim(); else delete registro.titulo;
  if (descricao.trim()) registro.descricao = descricao.trim(); else delete registro.descricao;

  const soDescricao = Object.keys(registro).length === 1 && registro.descricao;
  if (Object.keys(registro).length === 0) delete tudo[chaveSalva]; else tudo[chaveSalva] = soDescricao ? registro.descricao : registro;

  const temporario = `${arquivo}.tmp`;
  await writeFile(temporario, JSON.stringify(tudo, null, 2) + '\n');
  await rename(temporario, arquivo);
  json(res, 200, { ok: true });
}

async function servirArquivo(res, url) {
  let relativo;
  try { relativo = decodeURIComponent(url.pathname); } catch { res.writeHead(400); return res.end(); }
  if (relativo === '/') relativo = '/index.html';

  const caminho = path.resolve(RAIZ, '.' + relativo);
  const primeiro = path.relative(RAIZ, caminho).split(path.sep)[0];
  if (!caminho.startsWith(RAIZ + path.sep) || !PUBLICOS.has(primeiro)) { res.writeHead(404); return res.end('Não encontrado'); }

  let info;
  try { info = await stat(caminho); } catch { res.writeHead(404); return res.end('Não encontrado'); }
  if (!info.isFile()) { res.writeHead(404); return res.end('Não encontrado'); }

  res.writeHead(200, {
    'Content-Type': TIPOS[path.extname(caminho).toLowerCase()] || 'application/octet-stream',
    'Content-Length': info.size,
    'Cache-Control': 'no-cache',
  });
  createReadStream(caminho).pipe(res);
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (req.method === 'GET' && url.pathname === '/entregas.json') return json(res, 200, await gerarIndice());
    if (req.method === 'GET' && url.pathname === '/api/status') return json(res, 200, { upload: true, editar: true });
    if (req.method === 'POST' && url.pathname === '/api/upload') return await receberUpload(req, res, url);
    if (req.method === 'POST' && url.pathname === '/api/meta') return await salvarMeta(req, res);
    if (req.method === 'GET' || req.method === 'HEAD') return await servirArquivo(res, url);
    res.writeHead(405); res.end();
  } catch (erro) {
    console.error(erro);
    if (!res.headersSent) json(res, 500, { erro: 'Erro interno.' }); else res.end();
  }
}).listen(PORTA, HOST, () => console.log(`Site de entregas DPlay Solutions: http://${HOST}:${PORTA}`));
