/**
 * 通用拼音处理工具
 */

// 拼音映射表 - 常用汉字的拼音映射
const PINYIN_MAP: { [key: string]: string } = {
  // 数字
  '一': 'yi', '二': 'er', '三': 'san', '四': 'si', '五': 'wu', '六': 'liu', '七': 'qi', '八': 'ba', '九': 'jiu', '十': 'shi',
  '零': 'ling', '百': 'bai', '千': 'qian', '万': 'wan', '亿': 'yi',
  
  // 常用字
  '文': 'wen', '件': 'jian', '夹': 'jia', '图': 'tu', '片': 'pian', '音': 'yin', '乐': 'le', '视': 'shi', '频': 'pin',
  '应': 'ying', '用': 'yong', '程': 'cheng', '序': 'xu', '软': 'ruan', '系': 'xi', '统': 'tong',
  '浏': 'liu', '览': 'lan', '器': 'qi', '编': 'bian', '辑': 'ji', '播': 'bo', '放': 'fang',
  '微': 'wei', '信': 'xin', '聊': 'liao', '天': 'tian', '游': 'you', '戏': 'xi',
  '办': 'ban', '公': 'gong', '记': 'ji', '事': 'shi', '本': 'ben', '计': 'ji', '算': 'suan',
  '下': 'xia', '载': 'zai', '工': 'gong', '具': 'ju', '管': 'guan', '理': 'li',
  '设': 'she', '置': 'zhi', '配': 'pei', '帮': 'bang', '助': 'zhu',
  '开': 'kai', '发': 'fa', '代': 'dai', '码': 'ma', '控': 'kong', '制': 'zhi', '台': 'tai',
  '网': 'wang', '络': 'luo', '连': 'lian', '接': 'jie', '服': 'fu', '务': 'wu',
  '数': 'shu', '据': 'ju', '库': 'ku', '分': 'fen', '析': 'xi', '处': 'chu',
  '安': 'an', '全': 'quan', '防': 'fang', '火': 'huo', '墙': 'qiang', '杀': 'sha', '毒': 'du',
  '压': 'ya', '缩': 'suo', '解': 'jie', '包': 'bao', '备': 'bei', '份': 'fen',
  '输': 'shu', '入': 'ru', '法': 'fa', '字': 'zi', '体': 'ti',
  '屏': 'ping', '幕': 'mu', '录': 'lu', '截': 'jie',
  '清': 'qing', '优': 'you', '化': 'hua', '加': 'jia', '速': 'su',
  '电': 'dian', '脑': 'nao', '手': 'shou', '机': 'ji', '平': 'ping', '板': 'ban',
  '同': 'tong', '步': 'bu', '云': 'yun', '盘': 'pan', '存': 'cun', '储': 'chu',
  
  // 方向和操作
  '上': 'shang', '左': 'zuo', '右': 'you', '前': 'qian', '后': 'hou',
  '新': 'xin', '建': 'jian', '创': 'chuang', '删': 'shan', '除': 'chu', '修': 'xiu', '改': 'gai',
  '保': 'bao', '另': 'ling', '为': 'wei',
  '打': 'da', '关': 'guan', '闭': 'bi', '退': 'tui', '出': 'chu',
  '复': 'fu', '粘': 'zhan', '贴': 'tie', '剪': 'jian', '切': 'qie',
  '撤': 'che', '销': 'xiao', '重': 'chong', '做': 'zuo', '恢': 'hui',
  
  // 颜色
  '红': 'hong', '绿': 'lv', '蓝': 'lan', '黄': 'huang', '黑': 'hei', '白': 'bai',
  '紫': 'zi', '橙': 'cheng', '粉': 'fen', '灰': 'hui', '棕': 'zong',
  
  // 时间
  '年': 'nian', '月': 'yue', '日': 'ri', '秒': 'miao',
  '今': 'jin', '明': 'ming', '昨': 'zuo', '早': 'zao', '晚': 'wan',
  
  // 常用品牌和软件
  '谷': 'gu', '歌': 'ge', '度': 'du', '腾': 'teng', '讯': 'xun',
  '阿': 'a', '里': 'li', '京': 'jing', '东': 'dong', '美': 'mei', '团': 'tuan',
  '滴': 'di', '快': 'kuai', '抖': 'dou',
  '企': 'qi', '钉': 'ding', '飞': 'fei', '书': 'shu',
  '石': 'shi', '墨': 'mo', '印': 'yin', '象': 'xiang', '笔': 'bi',
  '易': 'yi', '虾': 'xia', '米': 'mi',
  '搜': 'sou', '狗': 'gou', '狐': 'hu', '猎': 'lie', '豹': 'bao',
  
  // 常见后缀
  '版': 'ban', '型': 'xing', '式': 'shi', '类': 'lei', '种': 'zhong',
  '专': 'zhuan', '标': 'biao', '准': 'zhun', '高': 'gao', '级': 'ji',
  '个': 'ge', '人': 'ren', '免': 'mian', '费': 'fei',
  '试': 'shi', '正': 'zheng', '破': 'po'
}

// 拼音首字母映射
const INITIAL_MAP: { [key: string]: string } = {}
Object.keys(PINYIN_MAP).forEach(char => {
  const pinyin = PINYIN_MAP[char]
  if (pinyin && pinyin.length > 0) {
    INITIAL_MAP[char] = pinyin[0]
  }
})

interface PinyinResult {
  full: string      // 完整拼音
  initial: string   // 首字母
  mixed: string     // 混合（中文+拼音）
}

/**
 * 拼音缓存
 */
class PinyinCache {
  private cache = new Map<string, PinyinResult>()
  private maxSize = 1000

  get(text: string): PinyinResult | undefined {
    return this.cache.get(text)
  }

  set(text: string, result: PinyinResult): void {
    if (this.cache.size >= this.maxSize) {
      // 删除最早的缓存
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(text, result)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

const pinyinCache = new PinyinCache()

/**
 * 判断字符是否为中文
 */
export function isChineseChar(char: string): boolean {
  return /[\u4e00-\u9fff]/.test(char)
}

/**
 * 单个汉字转拼音
 */
export function charToPinyin(char: string): { full: string; initial: string } {
  if (!isChineseChar(char)) {
    return { full: char.toLowerCase(), initial: char.toLowerCase() }
  }

  const full = PINYIN_MAP[char] || char.toLowerCase()
  const initial = INITIAL_MAP[char] || (char.toLowerCase().length > 0 ? char.toLowerCase()[0] : char.toLowerCase())
  
  return { full, initial }
}

/**
 * 中文文本转拼音
 */
export function textToPinyin(text: string): PinyinResult {
  if (!text) {
    return { full: '', initial: '', mixed: '' }
  }

  // 检查缓存
  const cached = pinyinCache.get(text)
  if (cached) {
    return cached
  }

  const chars = Array.from(text)
  let full = ''
  let initial = ''
  let mixed = ''

  for (const char of chars) {
    if (isChineseChar(char)) {
      const pinyin = charToPinyin(char)
      full += pinyin.full
      initial += pinyin.initial
      mixed += pinyin.full
    } else {
      // 非中文字符直接添加
      const lowerChar = char.toLowerCase()
      full += lowerChar
      initial += lowerChar
      mixed += char
    }
  }

  const result: PinyinResult = { full, initial, mixed }
  
  // 缓存结果
  pinyinCache.set(text, result)
  
  return result
}

/**
 * 拼音匹配函数
 */
export function pinyinMatch(text: string, query: string): {
  matches: boolean
  score: number
  matchType: 'exact' | 'pinyin_full' | 'pinyin_initial' | 'partial' | 'none'
} {
  if (!text || !query) {
    return { matches: false, score: 0, matchType: 'none' }
  }

  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // 1. 精确匹配 - 最高优先级
  if (textLower.includes(queryLower)) {
    const exactScore = queryLower.length === textLower.length ? 100 : 90
    return { matches: true, score: exactScore, matchType: 'exact' }
  }

  // 2. 拼音匹配
  const pinyin = textToPinyin(text)

  // 2.1 完整拼音匹配
  if (pinyin.full.includes(queryLower)) {
    return { matches: true, score: 80, matchType: 'pinyin_full' }
  }

  // 2.2 拼音首字母匹配
  if (pinyin.initial.includes(queryLower)) {
    return { matches: true, score: 70, matchType: 'pinyin_initial' }
  }

  // 2.3 混合匹配（支持中文和拼音混合查询）
  if (pinyin.mixed.toLowerCase().includes(queryLower)) {
    return { matches: true, score: 60, matchType: 'partial' }
  }

  // 3. 模糊匹配 - 容错处理
  const similarity = calculateSimilarity(queryLower, pinyin.full)
  if (similarity > 0.6) {
    return { matches: true, score: Math.floor(similarity * 50), matchType: 'partial' }
  }

  return { matches: false, score: 0, matchType: 'none' }
}

/**
 * 计算字符串相似度
 */
function calculateSimilarity(str1: string, str2: string): number {
  const len1 = str1.length
  const len2 = str2.length
  const matrix: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0))

  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,    // deletion
          matrix[i][j - 1] + 1,    // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        )
      }
    }
  }

  const distance = matrix[len1][len2]
  return 1 - distance / Math.max(len1, len2)
}

/**
 * 为应用程序列表预处理拼音
 */
export function preprocessApplicationsPinyin(applications: Array<{ name: string; [key: string]: any }>) {
  return applications.map(app => {
    const pinyin = textToPinyin(app.name)
    return {
      ...app,
      __pinyin: pinyin
    }
  })
}

/**
 * 支持拼音的应用搜索
 */
export function searchApplicationsWithPinyin(
  applications: Array<{ name: string; __pinyin?: PinyinResult; [key: string]: any }>,
  query: string,
  options: {
    maxResults?: number
    threshold?: number
  } = {}
): Array<{ item: any; score: number; matchType: string }> {
  const { maxResults = 10, threshold = 0 } = options

  if (!query.trim()) {
    return []
  }

  const results: Array<{ item: any; score: number; matchType: string }> = []

  for (const app of applications) {
    const match = pinyinMatch(app.name, query)
    
    if (match.matches && match.score >= threshold) {
      results.push({
        item: app,
        score: match.score,
        matchType: match.matchType
      })
    }
  }

  // 按分数排序
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, maxResults)
}

/**
 * 清理拼音缓存
 */
export function clearPinyinCache(): void {
  pinyinCache.clear()
  console.log('拼音缓存已清空')
}

/**
 * 获取拼音缓存统计
 */
export function getPinyinCacheStats(): { size: number; maxSize: number } {
  return {
    size: pinyinCache.size(),
    maxSize: 1000
  }
}

/**
 * 扩展拼音映射表（用于添加自定义映射）
 */
export function addPinyinMapping(mappings: { [char: string]: string }): void {
  Object.assign(PINYIN_MAP, mappings)
  
  // 更新首字母映射
  Object.keys(mappings).forEach(char => {
    INITIAL_MAP[char] = mappings[char][0]
  })
  
  console.log(`已添加 ${Object.keys(mappings).length} 个拼音映射`)
}

/**
 * 智能查询建议（根据拼音匹配提供建议）
 */
export function getSuggestions(
  query: string, 
  candidates: string[], 
  maxSuggestions = 5
): Array<{ text: string; score: number }> {
  if (!query.trim()) {
    return []
  }

  const suggestions: Array<{ text: string; score: number }> = []

  for (const candidate of candidates) {
    const match = pinyinMatch(candidate, query)
    
    if (match.matches) {
      suggestions.push({
        text: candidate,
        score: match.score
      })
    }
  }

  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
}

export default {
  textToPinyin,
  pinyinMatch,
  searchApplicationsWithPinyin,
  preprocessApplicationsPinyin,
  clearPinyinCache,
  getPinyinCacheStats,
  addPinyinMapping,
  getSuggestions,
  isChineseChar,
  charToPinyin
}
