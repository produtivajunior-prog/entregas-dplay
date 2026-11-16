# DPlay Solutions · Entregas do Projeto

Site com as entregas do projeto de **Estruturação Comercial** da DPlay Solutions, feito pela Produtiva Júnior, organizadas por frente:
**Processo Comercial, Prospecção e Vendas, Marketing, CRM e Automação e Sucesso do Cliente**.
Usa a identidade da DPlay (azul-marinho `#071431`, azul `#057EF3`/`#0157C6` e azul-céu `#31B7FF`, fonte Montserrat, logo do globo). Mesmo modelo dos sites de entregas da LocExpress e da Aqua Coco. Não precisa instalar nada além do Node.js.

## Como usar

```bash
node server.mjs        # abre em http://127.0.0.1:3000  (PORT=4310 node server.mjs para trocar a porta)
```

### Anexar arquivos
- **Pelo site:** entre no setor e arraste os arquivos para a área "Anexar arquivos" (ou clique para escolher).
- **Pela pasta:** copie os arquivos para `entregas/<frente>/` e atualize a página.
  - Subpastas viram grupos dentro do setor (ex.: `entregas/sucesso/Editaveis/…`).

Pastas: `entregas/processo`, `entregas/prospeccao`, `entregas/marketing`, `entregas/crm`, `entregas/sucesso`.

### Descrição e capa de cada arquivo
- **Descrição:** fica em `descricoes.json`, no formato `"setor/arquivo.pdf": "texto"` (subpastas entram no caminho).
- **Capa:** `npm run capas` gera a 1ª página de cada PDF (fora do macOS: `pdftoppm -f 1 -l 1 -singlefile -jpeg -scale-to-x 480 -scale-to-y -1 arquivo.pdf capas/<frente>/arquivo`) e um print de cada arquivo `.html` em `capas/` (só no macOS; os HTML precisam do Google Chrome). Arquivos `.html` abrem como página, não como código. Rode depois de adicionar PDFs novos, junto com `npm run indice`.

### Página do CRM (frente CRM e Automação)
O banner no topo de CRM e Automação abre `#/crm/sistema`. O conteúdo fica em `RECURSOS_CRM`, `ETAPAS_LEAD` e `renderSistemaCrm()` em `assets/js/app.js`; o endereço do sistema é `SISTEMA_CRM_URL` (https://dplaystaff.cloud). Sem print da tela, o site mostra uma janela com a marca e o endereço. Para usar um print, salve a imagem em `assets/img/` e coloque o caminho em `"imagem"` no `destaque` da frente, em `setores.json`.

### Visualizador de documentos
Clicar no título, na capa ou em "Abrir" mostra o documento numa janela sobre o site (`assets/js/visualizador.js`): PDFs são desenhados com o PDF.js (carregado do cdnjs na primeira abertura), com zoom, número da página, "Nova aba" e "Baixar". Imagens têm zoom e páginas `.html` aparecem num quadro. Ctrl/Cmd+clique ainda abre em outra aba.

### Ordem dos documentos
Dentro de cada setor, os documentos com `"ordem": 1, 2, 3…` em `descricoes.json` aparecem nessa sequência. Os sem `ordem` vêm depois, do mais novo para o mais antigo.

### Bloco de apresentação da Produtiva
Fica no topo da página inicial (`blocoProdutiva()` em `assets/js/app.js`). Os números (entregas, setores, fluxogramas) são calculados sozinhos a partir dos arquivos.

### Mudar o título de um documento
Com `node server.mjs`, passe o mouse sobre o documento e clique no lápis: dá para trocar o **título exibido** (o nome do arquivo continua visível embaixo, em cinza) e a **descrição**. A mudança é salva em `descricoes.json`. Para ela aparecer no site publicado, é preciso publicar de novo. No site publicado o lápis não aparece.

### Subguia (anexo de um arquivo)
Um arquivo pode aparecer como aba dentro de outro, por exemplo o mapeamento (fluxograma) de um POP. Coloque o PDF numa subpasta `Mapeamentos/` do setor e, em `descricoes.json`, use:

```json
"implantacao/Mapeamentos/fluxo.pdf": {
  "anexoDe": "implantacao/POP-principal.pdf",
  "rotulo": "Mapeamento do processo",
  "descricao": "Texto breve"
}
```
Os PDFs em `Mapeamentos/` ganham uma prévia grande, com o espaço em branco recortado (`npm run capas`).

### Editar frentes
Nome, descrição e ícone de cada setor ficam em `setores.json` (`nomeCurto` é o nome usado no menu do topo, quando o nome completo é longo). Para criar um setor novo, adicione uma linha ali e use a pasta `entregas/<id>`.
Use `"tipo": "extra"` para uma entrega que não é um setor (ela aparece em “Além dos setores” e não entra na contagem de setores).
Ícones disponíveis: `fluxo`, `maleta`, `megafone`, `robo`, `coracao`, `carrinho`, `foguete`, `suporte`, `grafico`, `pessoas`.

### Publicar em hospedagem estática
O botão de anexar só existe com `node server.mjs` (no site publicado ele some e o site fica só para consulta). Para publicar (Vercel, Netlify, GitHub Pages…):

```bash
npm run indice         # gera entregas.json com a lista atual de arquivos
```

e publique a pasta inteira. Rode o comando de novo sempre que adicionar arquivos.

## Estrutura
```
index.html · setores.json · server.mjs · scripts/indice.mjs
assets/ (css, js, img)   entregas/<frente>/ (arquivos anexados)
```

## Site publicado
- Endereço: **https://entregas-dplay.vercel.app** (projeto `entregas-dplay` na Vercel, ligado a este repositório).
- Toda alteração enviada para a branch `main` atualiza o site sozinha.
- `vercel.json` diz à Vercel que o site é estático (sem etapa de build). `.vercelignore` deixa de fora o servidor local e os scripts, que só servem no computador.
- Depois de adicionar ou trocar arquivos em `entregas/`, rode `npm run indice` (atualiza `entregas.json`) e gere as capas antes de enviar.
