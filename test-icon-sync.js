// 测试同步图标获取逻辑
import { app, ipcMain } from 'electron';

// 模拟图标缓存
const iconCache = new Map();

// 模拟智能图标数据库
const iconDatabase = {
  'notepad': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iNCIgZmlsbD0iIzAwN0FDQyIvPgo8cGF0aCBkPSJNMTQgMTZIMzRNMTQgMjJIMzRNMTQgMjhIMjgiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIvPgo8L3N2Zz4=',
  'calculator': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzMzMzMzMyIvPgo8cmVjdCB4PSI4IiB5PSI4IiB3aWR0aD0iMzIiIGhlaWdodD0iOCIgcng9IjIiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjEwIiB5PSIyMCIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjEiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjIxIiB5PSIyMCIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjEiIGZpbGw9IndoaXRlIi8+CjxyZWN0IHg9IjMyIiB5PSIyMCIgd2lkdGg9IjYiIGhlaWdodD0iNiIgcng9IjEiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
  'default': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiByeD0iNCIgZmlsbD0iIzY2NjY2NiIvPgo8cGF0aCBkPSJNMTYgMTZIMzJWMzJIMTZWMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4='
};

// 智能图标匹配函数
function getSmartIcon(filePath) {
  const fileName = filePath.toLowerCase();
  const appName = filePath.split(/[\\\/]/).pop()?.toLowerCase() || '';
  const baseName = appName.replace(/\.(exe|lnk)$/, '');

  // 精确匹配
  if (iconDatabase[baseName]) {
    return iconDatabase[baseName];
  }

  // 模糊匹配
  for (const [key, icon] of Object.entries(iconDatabase)) {
    if (key === 'default') continue;
    if (fileName.includes(key) || baseName.includes(key)) {
      return icon;
    }
  }

  return iconDatabase.default;
}

// 异步获取文件图标
async function getFileIcon(filePath) {
  try {
    console.log('测试：获取文件图标:', filePath);

    // 检查缓存
    if (iconCache.has(filePath)) {
      console.log('测试：从缓存返回图标');
      return iconCache.get(filePath);
    }

    // 使用Electron的app.getFileIcon方法
    const nativeImage = await app.getFileIcon(filePath, { size: 'normal' });

    if (nativeImage && !nativeImage.isEmpty()) {
      const dataUrl = nativeImage.toDataURL();
      console.log('测试：成功获取系统图标，数据长度:', dataUrl.length);

      iconCache.set(filePath, dataUrl);
      return dataUrl;
    } else {
      console.log('测试：系统图标为空，使用智能匹配');
      const smartIcon = getSmartIcon(filePath);
      if (smartIcon) {
        iconCache.set(filePath, smartIcon);
        return smartIcon;
      }
    }

    return null;
  } catch (error) {
    console.error('测试：获取文件图标失败:', error);

    // 错误时降级到智能图标匹配
    try {
      const smartIcon = getSmartIcon(filePath);
      if (smartIcon) {
        iconCache.set(filePath, smartIcon);
        return smartIcon;
      }
    } catch (fallbackError) {
      console.error('测试：智能图标匹配也失败:', fallbackError);
    }

    return null;
  }
}

// 测试函数
async function testIconLogic() {
  console.log('开始测试图标获取逻辑...');

  // 测试常见应用程序路径
  const testPaths = [
    'C:\\Windows\\System32\\notepad.exe',
    'C:\\Windows\\System32\\calc.exe',
    'C:\\Windows\\explorer.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\NonExistent\\fake.exe'
  ];

  for (const path of testPaths) {
    console.log(`\n测试路径: ${path}`);

    // 测试智能匹配
    const smartIcon = getSmartIcon(path);
    console.log('智能匹配结果:', smartIcon ? '成功' : '失败');

    // 测试完整流程
    try {
      const icon = await getFileIcon(path);
      console.log('完整流程结果:', icon ? '成功' : '失败');
      if (icon) {
        console.log('图标类型:', icon.startsWith('data:image/svg') ? 'SVG' : icon.startsWith('data:image/png') ? 'PNG' : '其他');
      }
    } catch (error) {
      console.error('测试失败:', error.message);
    }
  }

  console.log('\n图标获取逻辑测试完成！');
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  app.whenReady().then(() => {
    testIconLogic().then(() => {
      app.quit();
    });
  });
}

export { getFileIcon, getSmartIcon, testIconLogic };
