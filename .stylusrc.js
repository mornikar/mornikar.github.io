// hexo-renderer-stylus 配置：添加 _modules 路径到 stylus 搜索路径
// 解决 @import '_modules/modules' 后，modules.styl 中的 @import 'wikilink' 等找不到文件的问题
module.exports = {
  include: [
    'themes/arknights/source/css/_modules',
    'themes/arknights/source/css/_core',
    'themes/arknights/source/css/_custom',
    'themes/arknights/source/css/_page',
  ]
};
