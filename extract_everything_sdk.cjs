const fs = require('fs');
const path = require('path');

// Everything SDK DLL文件的二进制数据（从SDK中提取）
// 这里我们需要手动创建DLL文件，因为SDK是压缩包

console.log('正在创建Everything SDK DLL文件...');

// 创建dll目录
const dllDir = path.join(__dirname, 'everything-search-extension', 'dll');
if (!fs.existsSync(dllDir)) {
  fs.mkdirSync(dllDir, { recursive: true });
}

// 由于我们无法直接从压缩包中提取，我们需要使用一个简化的方法
// 创建一个占位符文件，实际使用时需要用户安装Everything
const placeholderContent = `
// Everything SDK DLL占位符
// 
// 要使用Everything SDK功能，请：
// 1. 下载Everything SDK: https://www.voidtools.com/Everything-SDK.zip
// 2. 解压并复制Everything64.dll和Everything32.dll到此目录
// 3. 或者确保系统PATH中包含Everything安装目录
//
// 当前将使用命令行模式作为降级方案
`;

fs.writeFileSync(path.join(dllDir, 'README.txt'), placeholderContent);

console.log('Everything SDK目录已创建，请手动添加DLL文件');
console.log('位置:', dllDir);
