/**
 * Tests for transform functionality
 * Tests duplicate prevention and deep copy fixes
 */

import { describe, it, expect } from 'vitest'
import { transform } from './transform.js'

describe('transform - duplicate prevention', () => {
  const keyMap = {
    'hello': '你好',
    'welcome': '欢迎',
    'title': '标题'
  }

  it('should skip already transformed code with $t(', () => {
    const code = `<template><div>{{ $t('hello') }}</div></template>`
    const result = transform(code, 'test.vue', keyMap)

    expect(result).toBeNull()
  })

  it('should transform code with Chinese text', () => {
    const code = `<template><div>你好</div></template>`
    const result = transform(code, 'test.vue', keyMap)

    expect(result).not.toBeNull()
    expect(result?.code).toContain('$t')
    expect(result?.code).toContain('{{')
  })

  it('should skip non-Vue files', () => {
    const code = `export const hello = '你好'`
    const result = transform(code, 'test.js', keyMap)

    expect(result).toBeNull()
  })

  it('should skip Vue files without template', () => {
    const code = `<script setup>const hello = '你好'</script>`
    const result = transform(code, 'test.vue', keyMap)

    expect(result).toBeNull()
  })

  it('should handle multiple transformations without duplication', () => {
    const code = `<template><div>你好</div><p>欢迎</p></template>`

    // First transformation
    const result1 = transform(code, 'test.vue', keyMap)
    expect(result1).not.toBeNull()

    // Second transformation on already transformed code should be skipped
    const result2 = transform(result1!.code, 'test.vue', keyMap)
    expect(result2).toBeNull()
  })

  it('should handle complex nested structures', () => {
    const code = `<template><div><span>你好</span><p>欢迎</p></div></template>`
    const result = transform(code, 'test.vue', keyMap)

    expect(result).not.toBeNull()
    expect(result?.code).toContain('$t')
  })

  it('should handle attributes with Chinese text', () => {
    const code = `<template><button title="欢迎">你好</button></template>`
    const result = transform(code, 'test.vue', keyMap)

    expect(result).not.toBeNull()
  })
})

describe('transform - deep copy behavior', () => {
  const keyMap = {
    'item1': '项目1',
    'item2': '项目2'
  }

  it('should not share references between transformed nodes', () => {
    const code = `<template><div>项目1</div><div>项目2</div></template>`
    const result = transform(code, 'test.vue', keyMap)

    expect(result).not.toBeNull()
    // Verify both transformations happened
    const matches = result!.code.match(/\$t\(/g)
    expect(matches?.length).toBe(2)
  })
})
