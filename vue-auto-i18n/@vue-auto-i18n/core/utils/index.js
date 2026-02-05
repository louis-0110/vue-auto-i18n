// src/utils/index.ts
import { promises as fs } from "fs";
import path from "path";
async function ensureDir(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}
async function saveExtractedText(result, config = {}) {
  const cacheDir = config.cacheDir || ".i18n-cache";
  await ensureDir(cacheDir);
  const filePath = path.join(cacheDir, "extracted.json");
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), "utf-8");
  return filePath;
}
async function loadExtractedText(config = {}) {
  const cacheDir = config.cacheDir || ".i18n-cache";
  const filePath = path.join(cacheDir, "extracted.json");
  try {
    await fs.access(filePath);
  } catch {
    throw new Error("Please run extract command first to extract text");
  }
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}
async function saveLocale(lang, data, config = {}) {
  const dir = config.localesDir || "src/locales";
  await ensureDir(dir);
  const filePath = path.join(dir, `${lang}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
  return filePath;
}
async function loadLocale(lang, config = {}) {
  const localesDir = config.localesDir || "src/locales";
  const filePath = path.join(localesDir, `${lang}.json`);
  try {
    await fs.access(filePath);
  } catch {
    return {};
  }
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content);
}
function generateKey(text, index) {
  if (text.length <= 20 && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(text)) {
    return text;
  }
  return `text_${index}`;
}
function hasChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}
function normalizeText(text) {
  return text.trim().replace(/\s+/g, " ");
}
async function readFile(filePath, encoding = "utf-8") {
  return await fs.readFile(filePath, encoding);
}
async function writeFile(filePath, content, encoding = "utf-8") {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, encoding);
}
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
export {
  ensureDir,
  fileExists,
  generateKey,
  hasChinese,
  loadExtractedText,
  loadLocale,
  normalizeText,
  readFile,
  saveExtractedText,
  saveLocale,
  writeFile
};
//# sourceMappingURL=index.js.map