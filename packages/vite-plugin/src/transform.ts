/**
 * AST Transformation Logic
 * Uses @vue/compiler-sfc for accurate Vue file transformation
 */

import { parse } from '@vue/compiler-sfc'

// Unique marker to identify already transformed files
const TRANSFORM_MARKER = '__vue_auto_i18n_transformed__'
const I18N_FUNCTION_PATTERN = /\$t\(['"]/

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

  // Enhanced duplicate check: skip if code is already transformed
  if (code.includes(TRANSFORM_MARKER) || I18N_FUNCTION_PATTERN.test(code)) {
    console.log(`[transform] Already transformed - skipping`)
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

    // Show the area around position 435 if the code is long enough
    if (newTemplateCode.length > 435) {
      const startPos = Math.max(0, 435 - 50)
      const endPos = Math.min(newTemplateCode.length, 435 + 50)
      console.log(`[transform] Code around position 435:`)
      console.log(`[transform] Position ${startPos}-${endPos}: "${newTemplateCode.substring(startPos, endPos)}"`)
      console.log(`[transform] Character at 435: "${newTemplateCode[435]}" (code: ${newTemplateCode.charCodeAt(435)})`)
    }

    // Debug: Check for duplicate attributes in individual elements
    // Parse the generated code to find elements with duplicate attrs
    const elementRegex = /<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g
    let elemMatch
    while ((elemMatch = elementRegex.exec(newTemplateCode)) !== null) {
      const elementTag = elemMatch[1]
      const elementCode = elemMatch[0]
      const elementStart = elemMatch.index

      // Find all attributes in this element (including : shorthand for v-bind)
      // Match both regular attributes and v-bind/: shorthand
      const attrRegex = /(?::\s*|[\s/>])([\w-]+)=/g
      const attrsInElement = new Map<string, number>()
      let attrMatch
      while ((attrMatch = attrRegex.exec(elementCode)) !== null) {
        const attrName = attrMatch[1]
        // Normalize :attr to attr for comparison
        const normalizedName = attrName
        if (!attrsInElement.has(normalizedName)) {
          attrsInElement.set(normalizedName, 0)
        }
        attrsInElement.set(normalizedName, attrsInElement.get(normalizedName)! + 1)
      }

      // Check if any attribute appears more than once in this element
      for (const [attrName, count] of attrsInElement) {
        if (count > 1) {
          console.log(`[transform] ⚠️  Warning: Element <${elementTag}> at position ${elementStart} has duplicate attribute "${attrName}" appearing ${count} times`)
          console.log(`[transform] Element code:`, elementCode)
        }
      }
    }

    // Additional check: look for the pattern "attrName=" appearing twice in close proximity
    // This catches cases where attributes might not have proper spacing
    const proximityRegex = /([\w-]+)=[^>]*?\s+([\w-]+)=/g
    let proxMatch
    while ((proxMatch = proximityRegex.exec(newTemplateCode)) !== null) {
      const attr1 = proxMatch[1]
      const attr2 = proxMatch[2]
      if (attr1 === attr2) {
        console.log(`[transform] ⚠️  Warning: Found duplicate attribute "${attr1}" in proximity at position ${proxMatch.index}`)
        console.log(`[transform] Context: "${newTemplateCode.substring(Math.max(0, proxMatch.index - 20), proxMatch.index + 50)}"`)
      }
    }

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
        // Return a completely new node to avoid reference sharing
        return {
          type: 6,
          name: node.name,
          value: {
            type: 4, // SIMPLE_EXPRESSION
            content: `$t('${chineseText}')`,
            isStatic: false,
            loc: node.value?.loc
          },
          loc: node.loc
        }
      }
    }
    // Return a copy to avoid reference issues
    return {
      type: node.type,
      name: node.name,
      value: node.value ? {
        type: node.value.type,
        content: node.value.content,
        isStatic: node.value.isStatic,  // Preserve isStatic!
        loc: node.value.loc
      } : null,
      loc: node.loc
    }
  }

  // Transform element nodes (type === 1)
  if (node.type === 1) {
    console.log(`[transformNode] Processing ELEMENT <${node.tag}> with ${node.children?.length || 0} children, isSelfClosing=${node.isSelfClosing}`)

    // Log all props before transformation
    if (node.props && node.props.length > 0) {
      console.log(`[transformNode] Props before transformation for <${node.tag}>:`)
      for (const prop of node.props) {
        if (prop.type === 6) {
          console.log(`  - Attribute: name="${prop.name}", value="${prop.value?.content || ''}", isStatic=${prop.value?.isStatic}`)
        } else if (prop.type === 7) {
          console.log(`  - Directive: name="${prop.name}", arg="${prop.arg || ''}"`)
        }
      }
    }

    // Transform children and props with new arrays to avoid reference sharing
    const transformedChildren = node.children ? node.children.map((child: any) =>
      transformNode(child, keyMap)
    ) : node.children

    // Transform props first
    let transformedProps = node.props ? node.props.map((prop: any) =>
      transformNode(prop, keyMap)
    ) : node.props

    // Log all props after transformation
    if (transformedProps && transformedProps.length > 0) {
      console.log(`[transformNode] Props after transformation for <${node.tag}>:`)
      for (const prop of transformedProps) {
        if (prop.type === 6) {
          console.log(`  - Attribute: name="${prop.name}", value="${prop.value?.content || ''}", isStatic=${prop.value?.isStatic}`)
        } else if (prop.type === 7) {
          console.log(`  - Directive: name="${prop.name}", arg="${prop.arg || ''}"`)
        }
      }
    }

    // Remove duplicate props by name (keep LAST occurrence, not first)
    if (transformedProps && transformedProps.length > 0) {
      const seenProps = new Map<string, any>()
      const uniqueProps: any[] = []

      // Iterate in reverse to keep the last occurrence
      for (let i = transformedProps.length - 1; i >= 0; i--) {
        const prop = transformedProps[i]
        if (prop.type === 6) {
          // Attribute - use name as key
          if (!seenProps.has(prop.name)) {
            seenProps.set(prop.name, prop)
            uniqueProps.unshift(prop) // Add to beginning to maintain order
          } else {
            console.log(`[transformNode] Removing duplicate attribute: ${prop.name} (keeping last)`)
          }
        } else if (prop.type === 7) {
          // Directive - use name+arg as key
          const directiveKey = `${prop.name}${prop.arg ? ':' + prop.arg : ''}`
          if (!seenProps.has(directiveKey)) {
            seenProps.set(directiveKey, prop)
            uniqueProps.unshift(prop)
          } else {
            console.log(`[transformNode] Removing duplicate directive: ${directiveKey} (keeping last)`)
          }
        } else {
          // Other types - keep as is
          uniqueProps.unshift(prop)
        }
      }

      transformedProps = uniqueProps
      console.log(`[transformNode] Deduplicated props: ${node.props?.length || 0} -> ${transformedProps.length}`)
    }

    // Return a completely new object
    return {
      type: node.type,
      tag: node.tag,
      tagType: node.tagType,
      isSelfClosing: node.isSelfClosing,
      children: transformedChildren,
      props: transformedProps,
      loc: node.loc,
      ns: node.ns
    }
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

  console.log(`[generateElement] Generating <${node.tag}> with ${node.props?.length || 0} props`)

  // Opening tag
  code += `<${node.tag}`

  // Props
  if (node.props) {
    for (const prop of node.props) {
      if (prop.type === 6) {
        // Attribute
        // Check if value is a dynamic expression (like $t('key'))
        if (prop.value && prop.value.type === 4 && !prop.value.isStatic) {
          // Dynamic expression - use v-bind or : shorthand
          // Don't wrap dynamic expressions in quotes
          code += ` :${prop.name}="${prop.value.content.replace(/"/g, '&quot;')}"`
        } else if (prop.value && prop.value.content) {
          // Static attribute - escape quotes
          const escapedValue = prop.value.content.replace(/"/g, '&quot;')
          code += ` ${prop.name}="${escapedValue}"`
        } else {
          // Boolean attribute
          code += ` ${prop.name}`
        }
      } else if (prop.type === 7) {
        // Directive
        code += ` ${prop.name}${prop.arg ? ':' : ''}${prop.arg || ''}="${prop.exp?.content || ''}"`
      }
    }
  }

  // Self-closing
  if (node.isSelfClosing) {
    code += ' />'
    console.log(`[generateElement] Generated (self-closing): ${code}`)
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

  // Log the generated code for elements with props (for debugging)
  if (node.props && node.props.length > 0) {
    console.log(`[generateElement] Generated: ${code.substring(0, 200)}${code.length > 200 ? '...' : ''}`)
  }

  return code
}
