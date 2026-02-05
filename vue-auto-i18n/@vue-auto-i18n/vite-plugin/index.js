// src/index.ts
import { readFileSync } from "fs";
import { join } from "path";

// src/transform.ts
function transform(code, id, keyMap, mode = "replace") {
  if (!id.endsWith(".vue")) {
    return null;
  }
  if (!code.includes("<template")) {
    return null;
  }
  if (code.includes("{{ $t") || code.includes("{{$t")) {
    return null;
  }
  console.log(`[vite-plugin-auto-i18n] Processing: ${id.split("/").pop()}`);
  try {
    let transformedCode = code;
    let hasChanges = false;
    const templateMatch = code.match(/<template[^>]*>([\s\S]*?)<\/template>/);
    if (!templateMatch) {
      return null;
    }
    let template = templateMatch[1];
    const chinesePattern = />([^<{]*)</g;
    template = template.replace(chinesePattern, (match, text) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.length === 0) {
        return match;
      }
      for (const [key, value] of Object.entries(keyMap)) {
        if (value === trimmed) {
          hasChanges = true;
          return `>{{ $t('${key}') }}<`;
        }
      }
      return match;
    });
    const attrPattern = /(\s+)([\w-]+)=["']([^"']*[\u4e00-\u9fa5]+[^"']*)["']/g;
    template = template.replace(attrPattern, (match, space, attrName, attrValue) => {
      const trimmed = attrValue.trim();
      if (!trimmed) {
        return match;
      }
      for (const [key, value] of Object.entries(keyMap)) {
        if (value === trimmed) {
          hasChanges = true;
          return `${space}${attrName}="{{ $t('${key}') }}"`;
        }
      }
      return match;
    });
    if (hasChanges) {
      transformedCode = code.replace(
        /<template[^>]*>[\s\S]*?<\/template>/,
        `<template>${template}</template>`
      );
      console.log(`[vite-plugin-auto-i18n] \u2713 Transformed: ${id.split("/").pop()}`);
      return {
        code: transformedCode,
        map: null
      };
    }
    console.log(`[vite-plugin-auto-i18n] - No Chinese text found`);
    return null;
  } catch (error) {
    console.error(`[vite-plugin-auto-i18n] Error transforming ${id}:`, error.message);
    return null;
  }
}

// src/cache.ts
import { promises as fs } from "fs";
import { createHash } from "crypto";
import path from "path";
function createCacheManager(cacheDir) {
  const cachePath = path.join(process.cwd(), cacheDir, "vite-plugin-cache.json");
  let cache = /* @__PURE__ */ new Map();
  async function loadCache() {
    try {
      const content = await fs.readFile(cachePath, "utf-8");
      const data = JSON.parse(content);
      cache = new Map(Object.entries(data));
    } catch {
      cache = /* @__PURE__ */ new Map();
    }
  }
  async function saveCache() {
    try {
      const data = Object.fromEntries(cache);
      await fs.mkdir(path.dirname(cachePath), { recursive: true });
      await fs.writeFile(cachePath, JSON.stringify(data), "utf-8");
    } catch (error) {
      console.warn("Failed to save cache:", error);
    }
  }
  loadCache();
  return {
    get(id, code) {
      const hash = createHash("md5").update(code).digest("hex");
      const key = `${id}:${hash}`;
      const entry = cache.get(key);
      if (entry) {
        return {
          code: entry.code,
          map: null
        };
      }
      return null;
    },
    set(id, originalCode, result) {
      const hash = createHash("md5").update(originalCode).digest("hex");
      const key = `${id}:${hash}`;
      const entry = {
        code: result.code,
        timestamp: Date.now()
      };
      cache.set(key, entry);
      saveCache();
    },
    async clear() {
      cache.clear();
      try {
        await fs.unlink(cachePath);
      } catch {
      }
    }
  };
}

// src/index.ts
function createAutoI18nPlugin(options = {}) {
  const {
    localesDir = "src/locales",
    cacheDir = ".i18n-cache",
    devMode = false,
    injectI18n = true,
    transformMode = "replace"
  } = options;
  let keyMap = null;
  let isProduction = false;
  const cacheManager = createCacheManager(cacheDir);
  return {
    name: "vite-plugin-auto-i18n",
    enforce: "pre",
    // 在 Vue 插件之前执行，确保能拿到原始 .vue 文件
    // Detect production mode
    config(config, { command }) {
      isProduction = command === "build";
    },
    // Load language pack at build start
    buildStart() {
      cacheManager.clear();
      try {
        const zhPath = join(process.cwd(), localesDir, "zh-CN.json");
        const content = readFileSync(zhPath, "utf-8");
        keyMap = JSON.parse(content);
        if (!devMode) {
          console.log("\n\u{1F30D} [vite-plugin-auto-i18n] Language pack loaded");
          console.log(`   - Keys count: ${Object.keys(keyMap || {}).length}`);
          console.log(`   - Mode: ${isProduction ? "production" : "development"}`);
        }
      } catch (error) {
        console.warn("[vite-plugin-auto-i18n] Language pack not found, skipping transformation");
        keyMap = null;
      }
    },
    // Transform code
    transform(code, id) {
      if (!devMode && !isProduction) {
        return null;
      }
      if (!keyMap) {
        return null;
      }
      if (!/\.(vue|js|ts|jsx|tsx)$/.test(id)) {
        return null;
      }
      if (id.includes("node_modules")) {
        return null;
      }
      if (!devMode) {
        console.log(`[vite-plugin-auto-i18n] Processing: ${id.split("/").pop()}`);
      }
      const cached = cacheManager.get(id, code);
      if (cached) {
        if (!devMode) {
          console.log(`[vite-plugin-auto-i18n] Using cached result`);
        }
        return cached;
      }
      const result = transform(code, id, keyMap, transformMode);
      if (!devMode) {
        if (result && result.code !== code) {
          console.log(`[vite-plugin-auto-i18n] \u2713 Transformed: ${id.split("/").pop()}`);
        } else if (result) {
          console.log(`[vite-plugin-auto-i18n] - No changes needed`);
        } else {
          console.log(`[vite-plugin-auto-i18n] - Skipped (no transformation)`);
        }
      }
      if (result) {
        cacheManager.set(id, code, result);
      }
      return result;
    },
    // Handle HTML (optional)
    transformIndexHtml: {
      order: "post",
      handler(html) {
        if (!injectI18n || !keyMap) return html;
        return html;
      }
    }
  };
}
var index_default = createAutoI18nPlugin;
export {
  createAutoI18nPlugin,
  index_default as default
};
//# sourceMappingURL=index.js.map