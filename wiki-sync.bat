@echo off
chcp 65001 >nul 2>&1
REM ================================================
REM   Wiki-Hexo 同步脚本 v3.0
REM   功能：Wiki → Hexo 转换 → 构建 → Pagefind → 部署
REM ================================================

set "HEXO_DIR=%~dp0"
cd /d "%HEXO_DIR%"

echo.
echo ═══════════════════════════════════════════════
echo   Wiki-Hexo 同步脚本 v3.0
echo ═══════════════════════════════════════════════
echo.

REM 解析参数
set "MODE="
set "DRY_RUN="
set "FORCE="
:parse_args
if "%~1"=="" goto :args_done
if /i "%~1"=="--dry-run" (
    set "DRY_RUN=1"
    echo [模式] Dry-run 预览（不写入文件）
    echo.
    shift
    goto :parse_args
)
if /i "%~1"=="--force" (
    set "FORCE=1"
    echo [模式] 强制全量转换
    echo.
    shift
    goto :parse_args
)
shift
goto :parse_args
:args_done

echo [1/6] 清理旧构建文件...
call npx hexo clean
if errorlevel 1 (
    echo [错误] hexo clean 失败
    pause
    exit /b 1
)

echo.
echo [2/6] 转换 Wiki 到 Hexo...
if defined DRY_RUN (
    call node scripts\wiki-to-hexo.js --dry-run
) else if defined FORCE (
    call node scripts\wiki-to-hexo.js --force
) else (
    call node scripts\wiki-to-hexo.js
)
if errorlevel 1 (
    echo [错误] wiki-to-hexo.js 失败
    pause
    exit /b 1
)

echo.
echo [3/6] 生成静态文件...
call npx hexo generate
if errorlevel 1 (
    echo [错误] hexo generate 失败
    pause
    exit /b 1
)

echo.
echo [4/6] 构建 Pagefind 搜索索引...
if not exist "public" (
    echo [警告] public 目录不存在，跳过 Pagefind
) else (
    call npx pagefind --site public --output-path public\pagefind --no-build-dir
    if errorlevel 1 (
        echo [警告] Pagefind 索引失败，继续部署
    )
)

echo.
echo [5/6] 提交转换结果到 Git...
git add source/_posts/ .wiki/index.md .wiki/log.md 2>nul
git diff --cached --quiet --exit-code
if errorlevel 1 (
    echo      提交 Wiki 同步结果...
    git commit -m "chore: sync wiki posts %date% %time%"
    if errorlevel 1 (
        echo [警告] Git 提交失败（可能没有变更或网络问题）
    ) else (
        echo      推送中（需要认证）...
        git push 2>nul
        if errorlevel 1 (
            echo [警告] Git 推送失败，请在有网络的环境手动推送
        )
    )
) else (
    echo      没有新变更，跳过 Git 提交
)

echo.
echo [6/6] 部署到 GitHub Pages...
call npx hexo deploy
if errorlevel 1 (
    echo [错误] hexo deploy 失败
    echo.
    echo 注意：部署需要 GITHUB_TOKEN 环境变量
    echo   在 GitHub Settings → Developer settings → Personal access tokens
    echo   生成新 token，添加为仓库 Secrets（名称：GITHUB_TOKEN）
    echo.
    pause
    exit /b 1
)

echo.
echo ═══════════════════════════════════════════════
if defined DRY_RUN (
    echo   Dry-run 完成！请检查预览输出
) else (
    echo   全部完成！
)
echo   博客地址: https://mornikar.github.io/
echo ═══════════════════════════════════════════════
echo.
echo [可选] 本地预览: npx hexo server -p 4000
echo.
pause
