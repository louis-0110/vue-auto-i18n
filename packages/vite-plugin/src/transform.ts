/**
 * AST Transformation Logic
 * Uses @vue/compiler-sfc for accurate Vue file transformation
 */

import { parse } from '@vue/compiler-sfc'

export function transform(
  code: string,
  id: string,
  keyMap: Record<string, string>,
  mode: string = 'replace'
): { code: string; map: null } | null {
  console.log(`[transform] Called for ${id.split('/').pop()}`)
  console.log(`[transform] Code preview (first 200 chars):`, code.substring(0, 200))

  // Only handle .vue files
  if (!id.endsWith('.vue')) {
    console.log(`[transform] Not a .vue file`)
    return null
  }

  // Skip if not a complete Vue file (must have <template> tag)
  if (!code.includes('<template')) {
    console.log(`[transform] No template tag found - already processed by Vue plugin?`)
    return null
  }

  // Skip if code is already transformed (contains $t)
  if (code.includes('$t(') || code.includes('{{ $t')) {
    console.log(`[transform] Already contains $t()`)
    return null
  }

  console.log(`[transform] Proceeding with transformation`)

  try {
    const { descriptor, errors } = parse(code)

    if (errors && errors.length > 0) {
      // Parse errors are expected for partial files, silently skip
      return null
    }

    // Only transform if there's a template
    if (!descriptor.template) {
      return null
    }

    console.log(`[transform] Found template in ${id}`)
    console.log(`[transform] Template AST:`, JSON.stringify(descriptor.template.ast).substring(0, 500))

    // Transform template AST
    const transformedAst = transformNode(descriptor.template.ast, keyMap)

    console.log(`[transform] Transformed AST:`, JSON.stringify(transformedAst).substring(0, 500))

    // Generate template code from transformed AST
    const newTemplateCode = generateNode(transformedAst)

    console.log(`[transform] Generated code (first 300 chars):`, newTemplateCode.substring(0, 300))
    console.log(`[transform] Original template length: ${descriptor.template.content.length}`)
    console.log(`[transform] New template length: ${newTemplateCode.length}`)

    // Replace template in original code
    const templateStart = code.indexOf('<template')
    const templateEnd = code.indexOf('</template>')

    if (templateStart === -1 || templateEnd === -1) {
      return null
    }

    const beforeTemplate = code.substring(0, templateStart)
    const afterTemplate = code.substring(templateEnd + '</template>'.length)
    const transformedCode = beforeTemplate + `<template>${newTemplateCode}</template>` + afterTemplate

    if (transformedCode !== code) {
      console.log(`[transform] ✓ Code transformed successfully`)
      return {
        code: transformedCode,
        map: null
      }
    }

    console.log(`[transform] - No changes after transformation`)
    return null

  } catch (error: any) {
    // Silently skip errors - might be partial files or already processed
    if (error.message?.includes('At least one <template> or <script>')) {
      return null
    }
    console.error(`[vite-plugin-auto-i18n] Error transforming ${id}:`, error.message)
    return null
  }
}

/**
 * Transform template AST - replace Chinese text with {{ $t('key') }}
 */
function transformTemplateAst(ast: any, keyMap: Record<string, string>): string {
  if (!ast) return ''

  const transformedAst = transformNode(ast, keyMap)

  // Generate template code from transformed AST (without template tags)
  const code = generateNode(transformedAst)
  return code
}

/**
 * Recursively transform AST nodes
 */
function transformNode(node: any, keyMap: Record<string, string>): any {
  if (!node) return node

  // Debug: log root node processing
  if (node.type === 0) {
    console.log(`[transformNode] Processing ROOT node with ${node.children?.length || 0} children`)
    if (node.children && node.children.length > 0) {
      console.log(`[transformNode] First child type: ${node.children[0].type}, tag: ${node.children[0].tag || '(no tag)'}`)
    }
    // Recursively process children of ROOT node
    if (node.children) {
      return {
        ...node,
        children: node.children.map((child: any) => transformNode(child, keyMap))
      }
    }
    return node
  }

  // Transform text nodes (type === 2)
  if (node.type === 2) {
    const trimmed = node.content.trim()
    if (trimmed.length > 0 && trimmed.length < 50) {
      console.log(`[transformNode] Found TEXT node: "${trimmed}"`)
    }
    const chineseText = findChineseKey(node.content, keyMap)
    if (chineseText) {
      console.log(`[transformNode] ✓ Transforming to $t('${chineseText}')`)
      // Replace text node with interpolation
      return {
        type: 5, // INTERPOLATION
        content: {
          type: 4, // SIMPLE_EXPRESSION
          content: `$t('${chineseText}')`,
          isStatic: false
        },
        loc: node.loc
      }
    }
    // Not a Chinese text, keep original
    return node
  }

  // Transform attribute values (type === 6)
  if (node.type === 6) {
    if (node.value && node.value.content) {
      const chineseText = findChineseKey(node.value.content, keyMap)
      if (chineseText) {
        return {
          ...node,
          value: {
            type: 4, // SIMPLE_EXPRESSION
            content: `$t('${chineseText}')`,
            isStatic: false
          }
        }
      }
    }
    return node
  }

  // Transform element nodes (type === 1)
  if (node.type === 1) {
    console.log(`[transformNode] Processing ELEMENT <${node.tag}> with ${node.children?.length || 0} children`)
    const transformedNode = { ...node }

    // Transform children
    if (node.children) {
      transformedNode.children = node.children.map((child: any) =>
        transformNode(child, keyMap)
      )
    }

    // Transform props
    if (node.props) {
      transformedNode.props = node.props.map((prop: any) =>
        transformNode(prop, keyMap)
      )
    }

    return transformedNode
  }

  return node
}

/**
 * Find matching Chinese text in keyMap
 */
function findChineseKey(text: string, keyMap: Record<string, string>): string | null {
  const trimmed = text.trim()

  console.log(`[findChineseKey] Looking for: "${trimmed}"`)
  console.log(`[findChineseKey] keyMap keys:`, Object.keys(keyMap).slice(0, 5))

  for (const [key, value] of Object.entries(keyMap)) {
    console.log(`[findChineseKey] Comparing "${value}" with "${trimmed}"`)
    if (value === trimmed) {
      console.log(`[findChineseKey] ✓ Found match: ${key}`)
      return key
    }
  }

  console.log(`[findChineseKey] ✗ No match found`)
  return null
}

/**
 * Generate code from AST node
 */
function generateNode(node: any, indent: string = ''): string {
  if (!node) return ''

  switch (node.type) {
    case 0: // ROOT_NODE - recursively process children
      if (node.children) {
        return node.children.map((child: any) => generateNode(child, indent)).join('')
      }
      return ''

    case 1: // ELEMENT
      return generateElement(node, indent)

    case 2: // TEXT
      return node.content

    case 3: // COMMENT
      return `<!--${node.content}-->`

    case 4: // SIMPLE_EXPRESSION
      return node.content

    case 5: // INTERPOLATION
      return `{{${node.content.content}}}`

    case 6: // ATTRIBUTE
      return `${node.name}="${node.value?.content || ''}"`

    default:
      return ''
  }
}

/**
 * Generate element code
 */
function generateElement(node: any, indent: string = ''): string {
  let code = ''

  // Opening tag
  code += `<${node.tag}`

  // Props
  if (node.props) {
    for (const prop of node.props) {
      if (prop.type === 6) {
        // Attribute
        const attrValue = prop.value?.content || ''
        code += ` ${prop.name}="${attrValue}"`
      } else if (prop.type === 7) {
        // Directive
        code += ` ${prop.name}${prop.arg ? ':' : ''}${prop.arg || ''}="${prop.exp?.content || ''}"`
      }
    }
  }

  // Self-closing
  if (node.isSelfClosing) {
    code += ' />'
    return code
  }

  code += '>'

  // Children
  if (node.children) {
    for (const child of node.children) {
      code += generateNode(child, indent)
    }
  }

  // Closing tag
  code += `</${node.tag}>`

  return code
}
