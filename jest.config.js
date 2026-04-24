module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'scripts/wiki-compile.js',
    'scripts/wiki-to-hexo.js',
    '!**/node_modules/**',
  ],
  // wiki-compile.js 和 wiki-to-hexo.js 的内部函数需要导出才能测试
  // 我们通过 rewire 或直接 require 来访问
  transform: {},
};
