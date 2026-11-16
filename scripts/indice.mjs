// Lê as pastas em entregas/<setor>/ e monta a lista de arquivos de cada setor.
// Usado pelo server.mjs (a cada acesso) e, via `npm run indice`, para gerar o
// entregas.json quando o site for publicado em hospedagem estática.
import { readdir, stat, access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function lerSetores() {
  return JSON.parse(await readFile(path.join(RAIZ, 'setores.json'), 'utf8'));
}

// descricoes.json: { "setor/subpasta/arquivo.pdf": "Breve descrição" }
// também aceita { "ordem": 1 } (posição na lista; sem ordem, vem depois, do mais novo para o mais antigo)
// também aceita { "titulo": "Nome exibido no lugar do nome do arquivo", "descricao": "…" }
// ou, para um anexo (subguia) de outro arquivo:
//   { "descricao": "…", "anexoDe": "setor/arquivo-principal.pdf", "rotulo": "Mapeamento do processo" }
async function lerDescricoes() {
  try {
    const bruto = JSON.parse(await readFile(path.join(RAIZ, 'descricoes.json'), 'utf8'));
    return new Map(Object.entries(bruto).map(([caminho, texto]) => [caminho.normalize('NFC'), texto]));
  } catch {
    return new Map();
  }
}

async function varrer(base, descricoes, setor, grupo = '') {
  const arquivos = [];
  for (const item of await readdir(path.join(base, grupo), { withFileTypes: true })) {
    if (item.name.startsWith('.')) continue;
    const rel = grupo ? `${grupo}/${item.name}` : item.name;
    if (item.isDirectory()) {
      arquivos.push(...(await varrer(base, descricoes, setor, rel)));
    } else if (item.isFile()) {
      const info = await stat(path.join(base, rel));
      // NFC: mesmo nome em qualquer sistema (o macOS pode devolver acentos decompostos)
      const nome = item.name.normalize('NFC');
      const registro = { nome, grupo: grupo.normalize('NFC'), tamanho: info.size, modificado: info.mtime.toISOString() };
      const capa = ['capas', setor, ...(registro.grupo ? [registro.grupo] : []), `${path.parse(nome).name}.jpg`].join('/');
      if (await access(path.join(RAIZ, capa)).then(() => true, () => false)) registro.capa = capa;
      const meta = descricoes.get([setor, registro.grupo, nome].filter(Boolean).join('/'));
      if (typeof meta === 'string') registro.descricao = meta;
      else if (meta) {
        if (meta.titulo) registro.titulo = meta.titulo;
        if (Number.isFinite(meta.ordem)) registro.ordem = meta.ordem;
        if (meta.descricao) registro.descricao = meta.descricao;
        if (meta.anexoDe) registro.anexoDe = meta.anexoDe.normalize('NFC');
        if (meta.rotulo) registro.rotulo = meta.rotulo;
      }
      arquivos.push(registro);
    }
  }
  return arquivos;
}

// Anexos (subguias) saem da lista principal e passam para dentro do arquivo a que pertencem.
function agruparAnexos(lista, setor) {
  const chave = (a) => [setor, a.grupo, a.nome].filter(Boolean).join('/');
  const pais = new Map(lista.filter((a) => !a.anexoDe).map((a) => [chave(a), a]));
  return lista.filter((a) => {
    const pai = a.anexoDe && pais.get(a.anexoDe);
    if (!pai) { delete a.anexoDe; return true; } // sem pai válido: continua na lista principal
    delete a.anexoDe;
    (pai.anexos ||= []).push(a);
    return false;
  });
}

export async function gerarIndice() {
  const descricoes = await lerDescricoes();
  const indice = { geradoEm: new Date().toISOString(), setores: {} };
  for (const setor of await lerSetores()) {
    const pasta = path.join(RAIZ, 'entregas', setor.id);
    await mkdir(pasta, { recursive: true });
    indice.setores[setor.id] = agruparAnexos(await varrer(pasta, descricoes, setor.id), setor.id);
  }
  return indice;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const indice = await gerarIndice();
  await writeFile(path.join(RAIZ, 'entregas.json'), JSON.stringify(indice, null, 2));
  const total = Object.values(indice.setores).flat().reduce((n, a) => n + 1 + (a.anexos?.length || 0), 0);
  console.log(`entregas.json gerado: ${total} arquivo(s) em ${Object.keys(indice.setores).length} setores.`);
}
