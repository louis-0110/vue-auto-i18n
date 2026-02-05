var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/extractors/base.ts
var BaseExtractor;
var init_base = __esm({
  "src/extractors/base.ts"() {
    "use strict";
    BaseExtractor = class {
      constructor(options = {}) {
        this.options = {
          include: ["src/**/*.{vue,js,ts,jsx,tsx}"],
          exclude: ["node_modules/**"],
          useContext: false,
          maxLength: 20,
          // 默认最大20个字符
          allowMixed: false,
          // 不允许中英混合
          allowPunctuation: false,
          // 不允许标点符号
          ...options
        };
      }
      /**
       * Check if text contains Chinese characters
       * @param text - Text to check
       * @returns true if text contains Chinese
       */
      hasChinese(text) {
        return /[\u4e00-\u9fa5]/.test(text);
      }
      /**
       * Check if text should be extracted based on filtering rules
       * @param text - Text to check
       * @returns true if text should be extracted
       */
      shouldExtract(text) {
        if (!this.hasChinese(text)) {
          return false;
        }
        const normalized = text.trim();
        const chineseChars = normalized.match(/[\u4e00-\u9fa5]/g) || [];
        if (chineseChars.length > (this.options.maxLength || 20)) {
          return false;
        }
        if (!this.options.allowMixed) {
          const hasEnglish = /[a-zA-Z]/.test(normalized);
          const hasChinese = /[\u4e00-\u9fa5]/.test(normalized);
          if (hasEnglish && hasChinese) {
            return false;
          }
        }
        if (!this.options.allowPunctuation) {
          const hasPunctuation = /[,\.\!?;:'"~@#\$%\^&\*\(\)\[\]{}|\\\/\+\-=<>]/.test(normalized) || /[\u3002\uff0c\u3001\uff1f\uff01\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08uff09\u300a\u300b\uff1c\uff5e\uff5f\u2026\u2014\u2022\u25cf\u25cb]/.test(normalized);
          if (hasPunctuation) {
            return false;
          }
        }
        return true;
      }
      /**
       * Remove whitespace and normalize text
       * @param text - Text to normalize
       * @returns Normalized text
       */
      normalizeText(text) {
        return text.trim().replace(/\s+/g, " ");
      }
    };
  }
});

// src/extractors/vue-extractor.ts
var vue_extractor_exports = {};
__export(vue_extractor_exports, {
  VueExtractor: () => VueExtractor,
  extractFromVueFile: () => extractFromVueFile
});
import { parse } from "@vue/compiler-sfc";
function extractFromVueFile(filePath, content) {
  const extractor = new VueExtractor();
  return extractor.extract(filePath, content);
}
var VueExtractor;
var init_vue_extractor = __esm({
  "src/extractors/vue-extractor.ts"() {
    "use strict";
    init_base();
    VueExtractor = class extends BaseExtractor {
      constructor(options = {}) {
        super(options);
      }
      supports(filePath) {
        return filePath.endsWith(".vue");
      }
      async extract(filePath, content) {
        const results = [];
        try {
          const { descriptor, errors } = parse(content);
          if (errors && errors.length > 0) {
            console.warn(`Failed to parse Vue file: ${filePath}`, errors);
            return results;
          }
          if (descriptor.template) {
            const templateTexts = this.extractFromTemplate(descriptor.template.ast);
            results.push(...templateTexts);
          }
          if (descriptor.script || descriptor.scriptSetup) {
            const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || "";
            const scriptTexts = this.extractFromScript(scriptContent, "script");
            results.push(...scriptTexts);
          }
        } catch (error) {
          console.error(`Error processing Vue file: ${filePath}`, error);
        }
        return results;
      }
      /**
       * Extract Chinese text from template AST
       */
      extractFromTemplate(templateAst) {
        const texts = [];
        const traverse2 = (node) => {
          if (!node) return;
          if (node.type === 2 && this.shouldExtract(node.content)) {
            texts.push({
              text: this.normalizeText(node.content),
              line: node.loc?.start?.line || 0,
              column: node.loc?.start?.column || 0,
              type: "template"
            });
          }
          if (node.type === 1 && node.props) {
            node.props.forEach((prop) => {
              if (prop.type === 6 && this.shouldExtract(prop.value?.content)) {
                texts.push({
                  text: prop.value.content,
                  line: prop.loc?.start?.line || 0,
                  column: prop.loc?.start?.column || 0,
                  type: "template",
                  context: `attribute: ${prop.name}`
                });
              }
            });
          }
          if (node.children) {
            node.children.forEach(traverse2);
          }
        };
        traverse2(templateAst);
        return texts;
      }
      /**
       * Extract Chinese text from script content (using regex as fallback)
       */
      extractFromScript(scriptContent, source) {
        const texts = [];
        if (!scriptContent) return texts;
        const patterns = [
          /['"`]([^'"`]*[\u4e00-\u9fa5]+[^'"`]*)['"`]/g
        ];
        patterns.forEach((pattern) => {
          let match;
          while ((match = pattern.exec(scriptContent)) !== null) {
            const text = match[1];
            if (this.shouldExtract(text) && text.trim().length > 0) {
              texts.push({
                text: this.normalizeText(text),
                line: 0,
                column: 0,
                type: "script"
              });
            }
          }
        });
        return texts;
      }
    };
  }
});

// src/extractors/js-extractor.ts
var js_extractor_exports = {};
__export(js_extractor_exports, {
  JSExtractor: () => JSExtractor,
  extractFromJSFile: () => extractFromJSFile
});
import { parse as parse2 } from "@babel/parser";
import traverse from "@babel/traverse";
function extractFromJSFile(filePath, content) {
  const extractor = new JSExtractor();
  return extractor.extract(filePath, content);
}
var JSExtractor;
var init_js_extractor = __esm({
  "src/extractors/js-extractor.ts"() {
    "use strict";
    init_base();
    JSExtractor = class extends BaseExtractor {
      constructor(options = {}) {
        super(options);
        this.options = {
          useBabel: true,
          babelPlugins: [
            "jsx",
            "typescript"
          ],
          ...options
        };
      }
      supports(filePath) {
        return /\.(js|ts|jsx|tsx)$/.test(filePath);
      }
      async extract(filePath, content) {
        if (this.options.useBabel) {
          return this.extractWithBabel(content, filePath);
        }
        return this.extractWithRegex(content);
      }
      /**
       * Extract Chinese text using Babel AST traversal
       */
      extractWithBabel(content, filePath) {
        const results = [];
        try {
          const ast = parse2(content, {
            sourceType: "module",
            plugins: this.options.babelPlugins
          });
          const traverseFn = traverse.default || traverse;
          traverseFn(ast, {
            // String literals
            StringLiteral: (path) => {
              const { node } = path;
              if (this.shouldExtract(node.value)) {
                results.push({
                  text: node.value,
                  line: node.loc?.start?.line || 0,
                  column: node.loc?.start?.column || 0,
                  type: "script"
                });
              }
            },
            // Template strings
            TemplateElement: (path) => {
              const { node } = path;
              if (this.shouldExtract(node.value.raw)) {
                results.push({
                  text: this.normalizeText(node.value.raw),
                  line: node.loc?.start?.line || 0,
                  column: node.loc?.start?.column || 0,
                  type: "script"
                });
              }
            }
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (process.env.VUE_I18N_VERBOSE === "true") {
            console.warn(`AST parsing failed for ${filePath}: ${errorMessage}`);
          }
          return this.extractWithRegex(content);
        }
        return results;
      }
      /**
       * Regex matching (fallback method)
       */
      extractWithRegex(content) {
        const results = [];
        const patterns = [
          // Single quoted strings
          /'([^']*[\u4e00-\u9fa5]+[^']*)'/g,
          // Double quoted strings
          /"([^"]*[\u4e00-\u9fa5]+[^"]*)"/g,
          // Template strings
          /`([^`]*[\u4e00-\u9fa5]+[^`]*)`/g,
          // JSX text
          />([^<]*[\u4e00-\u9fa5]+[^<]*)</g
        ];
        patterns.forEach((pattern) => {
          let match;
          while ((match = pattern.exec(content)) !== null) {
            const text = match[1].trim();
            if (this.shouldExtract(text) && text.length > 0) {
              results.push({
                text,
                line: 0,
                column: 0,
                type: "script"
              });
            }
          }
        });
        return results;
      }
    };
  }
});

// src/extractors/index.ts
init_base();
init_vue_extractor();
init_js_extractor();
async function extractChineseFromProject(options = {}) {
  const { VueExtractor: VueExtractor2 } = await Promise.resolve().then(() => (init_vue_extractor(), vue_extractor_exports));
  const { JSExtractor: JSExtractor2 } = await Promise.resolve().then(() => (init_js_extractor(), js_extractor_exports));
  const fg = (await import("fast-glob")).default;
  const fs = (await import("fs")).default;
  const path = (await import("path")).default;
  const {
    include = ["src/**/*.{vue,js,ts,jsx,tsx}"],
    exclude = ["node_modules/**"],
    maxLength,
    allowMixed,
    allowPunctuation
  } = options;
  const files = await fg.glob(include, { cwd: process.cwd(), ignore: exclude });
  const results = {
    uniqueTexts: [],
    fileMap: {},
    fileCount: 0,
    totalOccurrences: 0
  };
  const textMap = /* @__PURE__ */ new Map();
  const extractorOptions = {
    maxLength,
    allowMixed,
    allowPunctuation
  };
  const vueExtractor = new VueExtractor2(extractorOptions);
  const jsExtractor = new JSExtractor2(extractorOptions);
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    const content = fs.readFileSync(filePath, "utf-8");
    let extracted = [];
    if (file.endsWith(".vue")) {
      extracted = await vueExtractor.extract(filePath, content);
    } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
      extracted = await jsExtractor.extract(filePath, content);
    }
    if (extracted.length > 0) {
      results.fileMap[file] = extracted;
      results.fileCount++;
      results.totalOccurrences += extracted.length;
      extracted.forEach((item) => {
        const key = item.text;
        if (!textMap.has(key)) {
          textMap.set(key, {
            text: key,
            files: [{ file, line: item.line, column: item.column }]
          });
        } else {
          const existing = textMap.get(key);
          existing.files.push({ file, line: item.line, column: item.column });
        }
      });
    }
  }
  results.uniqueTexts = Array.from(textMap.values());
  return results;
}
export {
  BaseExtractor,
  JSExtractor,
  VueExtractor,
  extractChineseFromProject,
  extractFromJSFile,
  extractFromVueFile
};
//# sourceMappingURL=index.js.map