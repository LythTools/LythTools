/**
 * 拼音搜索功能演示和测试
 */

import {
  textToPinyin,
  pinyinMatch,
  searchApplicationsWithPinyin,
  preprocessApplicationsPinyin,
  getSuggestions,
  addPinyinMapping
} from './pinyinUtils'

// 模拟应用程序数据
const mockApplications = [
  { name: '微信', path: '/Applications/WeChat.app' },
  { name: 'QQ音乐', path: '/Applications/QQMusic.app' },
  { name: '网易云音乐', path: '/Applications/NeteaseMusic.app' },
  { name: '腾讯会议', path: '/Applications/TencentMeeting.app' },
  { name: '钉钉', path: '/Applications/DingTalk.app' },
  { name: '飞书', path: '/Applications/Feishu.app' },
  { name: '石墨文档', path: '/Applications/Shimo.app' },
  { name: '印象笔记', path: '/Applications/Evernote.app' },
  { name: '搜狗输入法', path: '/Applications/Sogou.app' },
  { name: '火狐浏览器', path: '/Applications/Firefox.app' },
  { name: 'Visual Studio Code', path: '/Applications/VSCode.app' },
  { name: '谷歌浏览器', path: '/Applications/Chrome.app' },
  { name: '百度网盘', path: '/Applications/BaiduPan.app' },
  { name: '阿里旺旺', path: '/Applications/AliWangWang.app' },
  { name: '美图秀秀', path: '/Applications/Meitu.app' },
  { name: '剪映', path: '/Applications/JianYing.app' }
]

/**
 * 演示基本拼音转换功能
 */
export function demonstratePinyinConversion() {
  console.log('\n=== 拼音转换演示 ===')
  
  const testCases = [
    '微信',
    'QQ音乐',
    '网易云音乐', 
    '腾讯会议',
    'Visual Studio Code',
    '火狐浏览器Firefox'
  ]

  testCases.forEach(text => {
    const pinyin = textToPinyin(text)
    console.log(`"${text}" ->`)
    console.log(`  全拼: ${pinyin.full}`)
    console.log(`  首字母: ${pinyin.initial}`)
    console.log(`  混合: ${pinyin.mixed}`)
    console.log()
  })
}

/**
 * 演示拼音匹配功能
 */
export function demonstratePinyinMatching() {
  console.log('\n=== 拼音匹配演示 ===')
  
  const testCases = [
    { app: '微信', queries: ['wx', 'weixin', '微信', 'weixn'] },
    { app: 'QQ音乐', queries: ['qqyy', 'qqyinyue', 'qq音乐', 'music'] },
    { app: '网易云音乐', queries: ['wyyyy', 'wangyiyun', '网易', 'cloudmusic'] },
    { app: '腾讯会议', queries: ['txhy', 'tengxun', '腾讯', 'meeting'] },
    { app: '谷歌浏览器', queries: ['ggllq', 'google', '谷歌', 'chrome'] }
  ]

  testCases.forEach(({ app, queries }) => {
    console.log(`\n应用: "${app}"`)
    queries.forEach(query => {
      const match = pinyinMatch(app, query)
      console.log(`  查询 "${query}": ${match.matches ? '✓' : '✗'} (分数: ${match.score}, 类型: ${match.matchType})`)
    })
  })
}

/**
 * 演示应用程序搜索功能
 */
export function demonstrateApplicationSearch() {
  console.log('\n=== 应用程序搜索演示 ===')
  
  const preprocessedApps = preprocessApplicationsPinyin(mockApplications)
  
  const searchQueries = [
    'wx',        // 微信
    'yy',        // 音乐相关应用
    'llq',       // 浏览器
    'hy',        // 会议
    'wj',        // 文件/文档相关
    'sg',        // 搜狗
    'vscode',    // VS Code
    'baidu'      // 百度
  ]

  searchQueries.forEach(query => {
    console.log(`\n搜索查询: "${query}"`)
    const results = searchApplicationsWithPinyin(preprocessedApps, query, { 
      maxResults: 5, 
      threshold: 50 
    })
    
    if (results.length === 0) {
      console.log('  无匹配结果')
    } else {
      results.forEach((result, index) => {
        console.log(`  ${index + 1}. ${result.item.name} (分数: ${result.score}, 类型: ${result.matchType})`)
      })
    }
  })
}

/**
 * 演示搜索建议功能
 */
export function demonstrateSearchSuggestions() {
  console.log('\n=== 搜索建议演示 ===')
  
  const appNames = mockApplications.map(app => app.name)
  const queries = ['wx', 'yy', 'gg', 'tx']

  queries.forEach(query => {
    console.log(`\n输入: "${query}" 的建议:`)
    const suggestions = getSuggestions(query, appNames, 3)
    
    if (suggestions.length === 0) {
      console.log('  无建议')
    } else {
      suggestions.forEach((suggestion, index) => {
        console.log(`  ${index + 1}. ${suggestion.text} (分数: ${suggestion.score})`)
      })
    }
  })
}

/**
 * 演示自定义拼音映射
 */
export function demonstrateCustomMapping() {
  console.log('\n=== 自定义拼音映射演示 ===')
  
  // 添加一些特殊的拼音映射（比如品牌名、专有名词等）
  const customMappings = {
    '饿': 'e',         // 饿了么
    '么': 'me',        // 饿了么
    '滴': 'di',        // 滴滴
    '哔': 'bi',        // 哔哩哔哩
    '哩': 'li',        // 哔哩哔哩
    '抖': 'dou',       // 抖音
    '映': 'ying',      // 剪映
    '秀': 'xiu'        // 美图秀秀
  }
  
  console.log('添加自定义映射:', customMappings)
  addPinyinMapping(customMappings)
  
  // 测试自定义映射效果
  const testApps = [
    '饿了么',
    '滴滴出行', 
    '哔哩哔哩',
    '抖音',
    '剪映',
    '美图秀秀'
  ]
  
  testApps.forEach(app => {
    const pinyin = textToPinyin(app)
    console.log(`"${app}" -> 全拼: ${pinyin.full}, 首字母: ${pinyin.initial}`)
  })
  
  // 测试搜索效果
  console.log('\n搜索测试:')
  const searchTests = [
    { app: '饿了么', query: 'elm' },
    { app: '滴滴出行', query: 'ddcx' },
    { app: '哔哩哔哩', query: 'blbl' },
    { app: '抖音', query: 'dy' },
    { app: '美图秀秀', query: 'mtxx' }
  ]
  
  searchTests.forEach(({ app, query }) => {
    const match = pinyinMatch(app, query)
    console.log(`"${app}" 匹配 "${query}": ${match.matches ? '✓' : '✗'} (分数: ${match.score})`)
  })
}

/**
 * 性能测试
 */
export function demonstratePerformance() {
  console.log('\n=== 性能测试 ===')
  
  const testData = []
  for (let i = 0; i < 1000; i++) {
    testData.push({
      name: `测试应用${i}`,
      path: `/Applications/TestApp${i}.app`
    })
  }
  testData.push(...mockApplications)
  
  const preprocessedData = preprocessApplicationsPinyin(testData)
  
  // 测试搜索性能
  const startTime = Date.now()
  const iterations = 100
  
  for (let i = 0; i < iterations; i++) {
    searchApplicationsWithPinyin(preprocessedData, 'wx', { maxResults: 10, threshold: 50 })
    searchApplicationsWithPinyin(preprocessedData, 'yy', { maxResults: 10, threshold: 50 })
    searchApplicationsWithPinyin(preprocessedData, 'test', { maxResults: 10, threshold: 50 })
  }
  
  const endTime = Date.now()
  const avgTime = (endTime - startTime) / (iterations * 3)
  
  console.log(`数据量: ${testData.length} 个应用`)
  console.log(`搜索次数: ${iterations * 3} 次`)
  console.log(`总耗时: ${endTime - startTime}ms`)
  console.log(`平均每次搜索: ${avgTime.toFixed(2)}ms`)
}

/**
 * 运行所有演示
 */
export function runAllDemonstrations() {
  console.log('🚀 LythTools 拼音搜索功能完整演示')
  console.log('=====================================')
  
  try {
    demonstratePinyinConversion()
    demonstratePinyinMatching()
    demonstrateApplicationSearch()
    demonstrateSearchSuggestions()
    demonstrateCustomMapping()
    demonstratePerformance()
    
    console.log('\n✅ 所有演示完成！')
    console.log('\n📝 使用说明:')
    console.log('1. 支持全拼输入: 输入 "weixin" 可找到 "微信"')
    console.log('2. 支持首字母输入: 输入 "wx" 可找到 "微信"')
    console.log('3. 支持混合输入: 输入 "wei信" 也可以找到 "微信"')
    console.log('4. 支持模糊匹配: 输入错误也能容错匹配')
    console.log('5. 支持自定义映射: 可以为特殊词汇添加拼音映射')
    console.log('6. 智能排序: 根据匹配度和类型智能排序结果')
    
  } catch (error) {
    console.error('演示过程中出现错误:', error)
  }
}

// 如果直接运行此文件，执行演示
if (typeof require !== 'undefined' && require.main === module) {
  runAllDemonstrations()
}

