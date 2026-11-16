// Gera a capa de cada arquivo .html em entregas/ (print da página renderizada) em capas/…/<arquivo>.jpg
// Precisa do Google Chrome e do macOS (usa o `sips` para converter). Chamado por `npm run capas`.
import { readdir, mkdir, rm, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { RAIZ } from './indice.mjs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const LARGURA = 1000;   // janela do navegador (px)
const ALTURA = 1414;    // proporção de uma folha A4, igual às capas dos PDFs
const SAIDA = 480;      // largura final da capa

async function htmls(pasta) {
  const lista = [];
  for (const item of await readdir(pasta, { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) lista.push(...(await htmls(caminho)));
    else if (/\.html?$/i.test(item.name)) lista.push(caminho);
  }
  return lista;
}

if (!existsSync(CHROME)) {
  console.log('Google Chrome não encontrado: capas dos arquivos HTML não foram geradas.');
  process.exit(0);
}

let geradas = 0;
for (const arquivo of await htmls(path.join(RAIZ, 'entregas'))) {
  const relativo = path.relative(path.join(RAIZ, 'entregas'), arquivo);
  const destino = path.join(RAIZ, 'capas', relativo.replace(/\.html?$/i, '.jpg'));
  const png = path.join(tmpdir(), `capa-${process.pid}-${geradas}.png`);
  await mkdir(path.dirname(destino), { recursive: true });
  // Cópia temporária com o tema claro forçado (a capa não depende do tema do computador de quem gera).
  const claro = path.join(tmpdir(), `capa-${process.pid}-${geradas}.html`);
  await writeFile(claro, `<!doctype html><html lang="pt-BR" data-theme="light"><meta charset="utf-8">${await readFile(arquivo, 'utf8')}`);
  execFileSync(CHROME, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${LARGURA},${ALTURA}`, '--virtual-time-budget=6000',
    `--screenshot=${png}`, pathToFileURL(claro).href,
  ], { stdio: 'ignore' });
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', '--resampleWidth', String(SAIDA), png, '--out', destino], { stdio: 'ignore' });
  await rm(png, { force: true });
  await rm(claro, { force: true });
  console.log(`capa: ${relativo}`);
  geradas++;
}
console.log(`${geradas} capa(s) de HTML gerada(s).`);
