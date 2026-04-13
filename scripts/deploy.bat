@echo off
REM Wiki-Hexo 自动部署脚本 v2.0

SET HEXO_DIR=D:\Auxiliary_means\Git\mornikar.github.io\Hexo

echo ========================================
echo   Wiki-Hexo 自动部署脚本 v2.0
echo ========================================
echo.

cd /d %HEXO_DIR%

echo [1/5] 清理旧文件...
call npx hexo clean

echo [2/5] 转换 Wiki 到 Hexo...
call node scripts\wiki-to-hexo.js

echo [3/5] 生成静态文件...
call npx hexo generate

echo [4/5] 安装并运行 Pagefind...
call npm install pagefind --save-dev
call npx pagefind --site public --output-path public/pagefind

echo [5/5] 部署到 GitHub Pages...
call npx hexo deploy

echo.
echo ========================================
echo   部署完成！
echo ========================================
pause
