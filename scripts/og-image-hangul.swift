// OCR every picture that can appear in a share card and list the ones that show Hangul.
// Uses macOS Vision (ko-KR + en-US). Output: data/og-image-hangul.json (public paths).
// Usage: swift scripts/og-image-hangul.swift <publicDir> <path>... > data/og-image-hangul.json
import Foundation
import Vision
import AppKit

let args = CommandLine.arguments
let publicDir = args[1]
var hits: [String] = []
for rel in args.dropFirst(2) {
  let url = URL(fileURLWithPath: publicDir + rel)
  guard let img = NSImage(contentsOf: url), let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.recognitionLanguages = ["ko-KR", "en-US"]
  req.usesLanguageCorrection = false
  try? VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
  var hangul = 0
  for o in req.results ?? [] {
    guard let c = o.topCandidates(1).first, c.confidence >= 0.3 else { continue }
    hangul += c.string.unicodeScalars.filter { (0xAC00...0xD7AF).contains($0.value) || (0x3130...0x318F).contains($0.value) }.count
  }
  if hangul >= 2 { hits.append(rel) }
}
let data = try! JSONSerialization.data(withJSONObject: hits.sorted(), options: [.prettyPrinted, .withoutEscapingSlashes])
print(String(data: data, encoding: .utf8)!)
