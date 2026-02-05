// src/index.ts
import { promises as fs } from "fs";
import path from "path";
import { parse } from "@vue/compiler-sfc";
import { parse as babelParse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import { loadLocale } from "@vue-auto-i18n/core";
async function replaceFiles(config, options = {}) {
  const {
    localesDir = config.localesDir || "src/locales",
    include = config.include || ["src/**/*.{vue,js,ts}"],
    exclude = config.exclude || ["node_modules/**"],
    createBackup = true,
    dryRun = false
  } = options;
  const zhPack = await loadLocale("zh-CN", { localesDir });
  if (Object.keys(zhPack).length === 0) {
    throw new Error("No language pack found. Please run extract and translate first.");
  }
  const textToKeyMap = {};
  for (const [key, value] of Object.entries(zhPack)) {
    textToKeyMap[value] = key;
  }
  const fg = await import("fast-glob");
  const files = await fg.glob(include, { cwd: process.cwd(), ignore: exclude });
  let totalFiles = 0;
  let totalReplacements = 0;
  let totalBackups = 0;
  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file);
    try {
      const content = await fs.readFile(filePath, "utf-8");
      let newContent = content;
      let replacements = 0;
      if (file.endsWith(".vue")) {
        const result = replaceVueFile(content, textToKeyMap);
        newContent = result.content;
        replacements = result.replacements;
      } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
        const result = replaceJSFile(content, textToKeyMap);
        newContent = result.content;
        replacements = result.replacements;
      }
      if (replacements > 0) {
        totalFiles++;
        totalReplacements += replacements;
        if (!dryRun) {
          if (createBackup) {
            const backupPath = filePath + ".bak";
            await fs.writeFile(backupPath, content, "utf-8");
            totalBackups++;
          }
          await fs.writeFile(filePath, newContent, "utf-8");
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Warning: Failed to process ${file}:`, errorMessage);
    }
  }
  return {
    files: totalFiles,
    replacements: totalReplacements,
    backups: totalBackups,
    dryRun
  };
}
function replaceVueFile(content, textToKeyMap) {
  let replacements = 0;
  try {
    const { descriptor } = parse(content);
    if (descriptor.template) {
      const template = descriptor.template.content;
      const newTemplate = replaceInTemplate(template, textToKeyMap);
      if (newTemplate !== template) {
        content = content.replace(template, newTemplate);
        replacements += countReplacements(template, newTemplate);
      }
    }
    const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || "";
    if (scriptContent) {
      const newScript = replaceInScript(scriptContent, textToKeyMap);
      if (newScript !== scriptContent) {
        content = content.replace(scriptContent, newScript);
        replacements += countReplacements(scriptContent, newScript);
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("Failed to parse Vue file:", errorMessage);
  }
  return { content, replacements };
}
function replaceJSFile(content, textToKeyMap) {
  const newContent = replaceInScript(content, textToKeyMap);
  const replacements = countReplacements(content, newContent);
  return { content: newContent, replacements };
}
function replaceInTemplate(template, textToKeyMap) {
  let result = template;
  for (const [text, key] of Object.entries(textToKeyMap)) {
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const attrRegex = new RegExp(`([a-zA-Z-]+)=["']${escapedText}["']`, "g");
    result = result.replace(attrRegex, (match, attrName) => {
      return `:${attrName}="$t('${key}')"`;
    });
    const textRegex = new RegExp(`>([^<{]*)${escapedText}([^<}]*)<`, "g");
    result = result.replace(textRegex, (match, prefix, suffix) => {
      if (prefix.includes("{") || suffix.includes("}")) return match;
      return `>{{ $t('${key}') }}<`;
    });
  }
  return result;
}
function replaceInScript(script, textToKeyMap) {
  try {
    const ast = babelParse(script, {
      sourceType: "module",
      plugins: ["jsx", "typescript", "decorators-legacy"]
    });
    let modified = false;
    traverse(ast, {
      StringLiteral(path2) {
        const { node } = path2;
        if (node.value in textToKeyMap) {
          const key = textToKeyMap[node.value];
          path2.replaceWith({
            type: "CallExpression",
            callee: {
              type: "Identifier",
              name: "t"
            },
            arguments: [
              {
                type: "StringLiteral",
                value: key
              }
            ]
          });
          modified = true;
        }
      }
    });
    if (modified) {
      const output = generate(ast, {}, script);
      return output.code;
    }
  } catch (error) {
    console.warn("AST parsing failed, using regex fallback");
    return replaceInScriptRegex(script, textToKeyMap);
  }
  return script;
}
function replaceInScriptRegex(script, textToKeyMap) {
  let result = script;
  for (const [text, key] of Object.entries(textToKeyMap)) {
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`['"]${escapedText}['"]`, "g");
    result = result.replace(regex, `t('${key}')`);
  }
  return result;
}
function countReplacements(original, modified) {
  const originalCount = (original.match(/\$t\(|t\(/g) || []).length;
  const modifiedCount = (modified.match(/\$t\(|t\(/g) || []).length;
  return Math.max(0, modifiedCount - originalCount);
}
export {
  replaceFiles
};
//# sourceMappingURL=index.js.map