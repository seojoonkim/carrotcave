// OCR every picture that can appear in a share card and list the ones that show Hangul.
// Uses macOS Vision (ko-KR + en-US). Output: data/og-image-hangul.json (public paths).
// Usage: swift scripts/og-image-hangul.swift <publicDir> <path>... > data/og-image-hangul.json
//
// Chinese guard (2026-10-05): a ~36px "央视网" broadcaster logo in the liang-wenfeng photo was read in ko-KR
// mode as "끗쉿ㅭ" at confidence 0.30 and failed the live release. A low-confidence Hangul reading is
// dropped when a zh-Hans pass reads Han characters in the same box. Real Korean text reads at high
// confidence, so it is always counted.
import Foundation
import Vision
import AppKit

func isHangul(_ v: UInt32) -> Bool { (0xAC00...0xD7AF).contains(v) || (0x3130...0x318F).contains(v) }
func isHan(_ v: UInt32) -> Bool { (0x4E00...0x9FFF).contains(v) || (0x3400...0x4DBF).contains(v) }

func read(_ cg: CGImage, _ langs: [String]) -> [(String, Float, CGRect)] {
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.recognitionLanguages = langs
  req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  return (req.results ?? []).compactMap { o in
    guard let c = o.topCandidates(1).first else { return nil }
    return (c.string, c.confidence, o.boundingBox)
  }
}

let strongConfidence: Float = 0.5
let args = CommandLine.arguments
let publicDir = args[1]
var hits: [String] = []
for rel in args.dropFirst(2) {
  let url = URL(fileURLWithPath: publicDir + rel)
  guard let img = NSImage(contentsOf: url), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  var hanBoxes: [CGRect]? = nil
  var hangul = 0
  for (text, conf, box) in read(cg, ["ko-KR", "en-US"]) {
    guard conf >= 0.3 else { continue }
    let n = text.unicodeScalars.filter { isHangul($0.value) }.count
    if n == 0 { continue }
    if conf < strongConfidence {
      if hanBoxes == nil {
        hanBoxes = read(cg, ["zh-Hans", "en-US"])
          .filter { $0.0.unicodeScalars.contains { isHan($0.value) } }
          .map { $0.2 }
      }
      if hanBoxes!.contains(where: { $0.intersects(box) }) { continue }
    }
    hangul += n
  }
  if hangul >= 2 { hits.append(rel) }
}
let data = try! JSONSerialization.data(withJSONObject: hits.sorted(), options: [.prettyPrinted, .withoutEscapingSlashes])
print(String(data: data, encoding: .utf8)!)
