// Gera a capa (1ª página) de cada PDF em entregas/ e salva em capas/<setor>/…/<arquivo>.jpg
// Só funciona no macOS (usa o PDFKit do sistema). Uso: npm run capas
import AppKit
import PDFKit

let raiz = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let entregas = raiz.appendingPathComponent("entregas")
let capas = raiz.appendingPathComponent("capas")
let larguraPadrao: CGFloat = 480      // capas dos documentos
let larguraMapa: CGFloat = 2800       // mapeamentos (fluxogramas): mais detalhe e recorte do espaço em branco
var geradas = 0

/// Recorta as margens brancas da imagem (os fluxogramas ocupam só uma parte da folha).
func recortarBranco(_ imagem: NSImage) -> CGImage? {
    guard let cg = imagem.cgImage(forProposedRect: nil, context: nil, hints: nil) else { return nil }
    let w = cg.width, h = cg.height
    var pixels = [UInt8](repeating: 255, count: w * h * 4)
    guard let ctx = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4,
                              space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue) else { return nil }
    ctx.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    ctx.fill(CGRect(x: 0, y: 0, width: w, height: h))
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))

    var minX = w, minY = h, maxX = 0, maxY = 0
    for y in 0..<h {
        for x in 0..<w {
            let i = (y * w + x) * 4
            if pixels[i] < 235 || pixels[i + 1] < 235 || pixels[i + 2] < 235 {
                if x < minX { minX = x }; if x > maxX { maxX = x }
                if y < minY { minY = y }; if y > maxY { maxY = y }
            }
        }
    }
    guard maxX > minX, maxY > minY else { return cg }
    let margem = 30
    let x0 = max(minX - margem, 0), y0 = max(minY - margem, 0)
    let x1 = min(maxX + margem, w - 1), y1 = min(maxY + margem, h - 1)
    return cg.cropping(to: CGRect(x: x0, y: y0, width: x1 - x0, height: y1 - y0))
}

guard let varredura = FileManager.default.enumerator(at: entregas, includingPropertiesForKeys: nil, options: [.skipsHiddenFiles]) else { exit(1) }
for caso in varredura {
    guard let url = caso as? URL, url.pathExtension.lowercased() == "pdf" else { continue }
    guard let doc = PDFDocument(url: url), let pagina = doc.page(at: 0) else { print("sem capa: \(url.lastPathComponent)"); continue }

    let area = pagina.bounds(for: .cropBox)
    let larguraMax = url.path.contains("/Mapeamentos/") ? larguraMapa : larguraPadrao
    let escala = larguraMax / area.width
    let tamanho = NSSize(width: larguraMax, height: (area.height * escala).rounded())
    let imagem = pagina.thumbnail(of: tamanho, for: .cropBox)

    let ehMapa = url.path.contains("/Mapeamentos/")
    let bitmap: NSBitmapImageRep
    if ehMapa, let recortada = recortarBranco(imagem) {
        bitmap = NSBitmapImageRep(cgImage: recortada)
    } else if let tiff = imagem.tiffRepresentation, let b = NSBitmapImageRep(data: tiff) {
        bitmap = b
    } else { continue }
    guard let jpeg = bitmap.representation(using: .jpeg, properties: [.compressionFactor: 0.85]) else { continue }

    let relativo = url.path.replacingOccurrences(of: entregas.path + "/", with: "")
    let destino = capas.appendingPathComponent(relativo).deletingPathExtension().appendingPathExtension("jpg")
    try? FileManager.default.createDirectory(at: destino.deletingLastPathComponent(), withIntermediateDirectories: true)
    try? jpeg.write(to: destino)
    print("capa: \(relativo)  \(bitmap.pixelsWide)x\(bitmap.pixelsHigh)")
    geradas += 1
}
print("\(geradas) capa(s) gerada(s).")
