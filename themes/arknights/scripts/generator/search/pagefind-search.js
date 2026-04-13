/**
 * Pagefind 搜索页面生成器
 */

'use strict';

function pagefindSearchGenerator(locals) {
    return [{
        path: 'search/index.html',
        layout: ['page', 'index'],
        data: {
            title: '搜索',
            comments: true
        }
    }];
}

module.exports = pagefindSearchGenerator;
