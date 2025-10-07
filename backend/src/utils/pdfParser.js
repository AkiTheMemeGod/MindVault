import fs from "fs";
import { createRequire } from "module";

// pdf-parse is a CommonJS module; when running under ESM imports in
// modern Node, it doesn't expose a default export. Use createRequire
// to load it with require() for compatibility.
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

export default async function pdfParser(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);
  return data && data.text ? data.text : "";
}
