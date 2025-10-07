import fs from "fs";
import { createRequire } from "module";

// pdf-parse is a CommonJS module; when running under ESM imports in
// modern Node, it doesn't expose a default export. Use createRequire
// to load it with require() for compatibility.
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export default async function pdfParser(input) {
  // input can be a file path (string) or a Buffer
  let dataBuffer;
  if (Buffer.isBuffer(input)) {
    dataBuffer = input;
  } else if (typeof input === 'string') {
    dataBuffer = fs.readFileSync(input);
  } else {
    throw new Error('Unsupported input type for pdfParser');
  }

  const data = await pdf(dataBuffer);
  return data && data.text ? data.text : "";
}
