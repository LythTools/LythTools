/**
 * 搜索相关工具函数
 */

/**
 * 检查是否为计算表达式
 * @param query 查询字符串
 * @returns 是否为计算表达式
 */
export function isCalculatorQuery(query: string): boolean {
  // 只允许数字、运算符、小数点、括号和空格
  return /^[\d+\-*/().\s]+$/.test(query.trim()) && query.trim().length > 0
}

/**
 * 安全计算表达式
 * @param expression 表达式
 * @returns 计算结果或null
 */
export function safeEvaluate(expression: string): number | null {
  try {
    // 去除空格
    const cleanExpression = expression.replace(/\s/g, '')
    
    // 验证表达式只包含允许的字符
    if (!/^[\d+\-*/().]+$/.test(cleanExpression)) {
      return null
    }
    
    // 防止除零错误的简单检查
    if (cleanExpression.includes('/0')) {
      return null
    }
    
    // 使用 Function 构造器安全执行
    const result = Function('"use strict"; return (' + cleanExpression + ')')()
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result
    }
    
    return null
  } catch (error) {
    return null
  }
}

/**
 * 模糊搜索匹配度评分
 * @param query 查询字符串
 * @param target 目标字符串
 * @returns 匹配度分数 (0-1)
 */
export function fuzzyMatchScore(query: string, target: string): number {
  const queryLower = query.toLowerCase()
  const targetLower = target.toLowerCase()
  
  // 完全匹配
  if (queryLower === targetLower) {
    return 1.0
  }
  
  // 开始匹配
  if (targetLower.startsWith(queryLower)) {
    return 0.9
  }
  
  // 包含匹配
  if (targetLower.includes(queryLower)) {
    return 0.7
  }
  
  // 字符匹配度
  let score = 0
  let queryIndex = 0
  
  for (let i = 0; i < targetLower.length && queryIndex < queryLower.length; i++) {
    if (targetLower[i] === queryLower[queryIndex]) {
      score += 1 / targetLower.length
      queryIndex++
    }
  }
  
  // 必须匹配所有查询字符
  if (queryIndex < queryLower.length) {
    return 0
  }
  
  return Math.min(score * 0.5, 0.6) // 最高0.6分给字符匹配
}

/**
 * 简单的拼音匹配（基础实现）
 * @param query 查询字符串
 * @param target 目标字符串
 * @returns 是否匹配
 */
// 弱拼音匹配实现已统一至 shared/utils/pinyinUtils.ts 的 pinyinMatch

/**
 * 高亮匹配文本
 * @param text 原文本
 * @param query 查询字符串
 * @returns 高亮后的文本
 */
export function highlightMatch(text: string, query: string): string {
  if (!query) return text
  
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

/**
 * 清理搜索查询字符串
 * @param query 原查询字符串
 * @returns 清理后的查询字符串
 */
export function cleanSearchQuery(query: string): string {
  return query
    .trim()
    .replace(/\s+/g, ' ') // 多个空格合并为一个
    .replace(/[^\w\s\u4e00-\u9fff+\-*/().]/g, '') // 去除特殊字符，保留中文、英文、数字和基本运算符
}

/**
 * 生成搜索建议
 * @param query 查询字符串
 * @param history 搜索历史
 * @returns 搜索建议列表
 */
export function generateSearchSuggestions(query: string, history: string[]): string[] {
  if (!query || query.length < 2) return []
  
  const queryLower = query.toLowerCase()
  const suggestions = new Set<string>()
  
  // 从历史记录中筛选建议
  for (const item of history) {
    const itemLower = item.toLowerCase()
    if (itemLower.includes(queryLower) && itemLower !== queryLower) {
      suggestions.add(item)
    }
  }
  
  // 常见搜索建议
  const commonSuggestions = [
    '计算器', '记事本', '文件管理器', '设置', '控制面板',
    '任务管理器', '画图', '命令提示符', '注册表编辑器'
  ]
  
  for (const suggestion of commonSuggestions) {
    if (suggestion.toLowerCase().includes(queryLower)) {
      suggestions.add(suggestion)
    }
  }
  
  return Array.from(suggestions).slice(0, 5)
}

/**
 * 检查是否为URL
 * @param text 文本
 * @returns 是否为URL
 */
export function isUrl(text: string): boolean {
  try {
    new URL(text)
    return true
  } catch {
    return /^https?:\/\//i.test(text)
  }
}

/**
 * 检查是否为文件路径
 * @param text 文本
 * @returns 是否为文件路径
 */
export function isFilePath(text: string): boolean {
  // Windows路径
  if (/^[a-zA-Z]:\\/.test(text)) return true
  
  // Unix/Linux路径
  if (text.startsWith('/')) return true
  
  // 相对路径
  if (/^\.\.?\//.test(text)) return true
  
  return false
}

