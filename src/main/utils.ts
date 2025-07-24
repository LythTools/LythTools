/**
 * 判断是否为开发环境
 */
export const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'

import { join } from 'path'

/**
 * 获取资源路径
 */
export function getAssetPath(...paths: string[]): string {
  const RESOURCES_PATH = isDev
    ? process.cwd()
    : process.resourcesPath

  return join(RESOURCES_PATH, 'assets', ...paths)
}
