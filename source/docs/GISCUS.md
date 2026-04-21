---
title: Giscus 留言系统
---
# 💬 Giscus 留言系统

> 基于 GitHub Discussions 的博客评论系统，无需数据库，简洁高效。

---

## 一、功能特性

| 特性 | 说明 |
|------|------|
| 🚀 **零维护** | 使用 GitHub Discussions 存储评论，无需独立数据库 |
| 🔒 **安全可靠** | 评论数据存储在你自己仓库的 Discussions 中 |
| 🎨 **主题适配** | 自动跟随网站明暗主题切换 |
| 🌐 **无服务器** | 纯前端嵌入，GitHub Pages 天然支持 |
| 💬 **GitHub 登录** | 访客使用 GitHub 账号评论，便于社区互动 |

---

## 二、工作原理

```
访客评论 → Giscus 前端 → GitHub API → 创建/更新 Discussion
                                    ↓
访客查看 ← Giscus 前端 ← GitHub API ← Discussion 数据
```

1. 访客在博客评论 → Giscus 调用 GitHub API
2. 系统在仓库中创建对应的 Discussion（每个页面一个 Discussion）
3. 评论数据存储在 GitHub Discussions 中
4. 其他访客查看评论时，从 Discussions 读取并展示

---

## 三、启用条件

### 3.1 仓库要求

| 要求 | 说明 |
|------|------|
| **公开仓库** | Giscus 需要访客能读取 Discussions |
| **安装 Giscus App** | 将 Giscus App 安装到你的仓库 |
| **开启 Discussions** | 在仓库 Settings → Features 中开启 |

### 3.2 安装 Giscus App

1. 打开 https://github.com/apps/giscus
2. 点击 **"Install"**
3. 选择 **"Only select repositories"**
4. 选择你的博客仓库
5. 点击 **"Install"**

### 3.3 开启 Discussions

1. 进入仓库 **Settings**
2. 找到 **Features** 部分
3. 勾选 **"Discussions"**
4. 点击 **"Start discussions"** 确认

---

## 四、获取配置参数

### 4.1 访问 Giscus 配置页

打开 https://giscus.app/zh-CN

### 4.2 配置参数

| 参数 | 设置值 | 说明 |
|------|--------|------|
| **仓库** | `用户名/仓库名` | 你的博客仓库 |
| **映射关系** | `pathname` | 页面路径映射到 Discussion |
| **分类** | `Announcements` | 评论所在的分类 |
| **主题** | `preferred_color_scheme` | 跟随系统明暗 |

### 4.3 创建 Discussion 分类

1. 在 Giscus 页面的「分类」下拉框中
2. 点击 **"Create a new category"**
3. 名称输入：`Announcements`
4. 类型选择：**"Announcements"**（公告类型）
5. 点击 **"Create"**

### 4.4 复制配置参数

记录以下三个关键参数：
- `data-repo-id`（如 `R_kgDOPto6vw`）
- `data-category-id`（如 `DIC_kwDOPto6v84C7YeI`）

---

## 五、配置博客

### 5.1 修改主题配置

编辑 `themes/arknights/_config.yml`：

```yaml
# Giscus
giscus:
  enable: true
  repo: 你的用户名/仓库名
  repo_id: 从 giscus.app 获取的仓库 ID
  category: Announcements
  category_id: 从 giscus.app 获取的分类 ID
  mapping: pathname
  input_position: top
  theme: preferred_color_scheme
  lang: zh-CN
  loading: lazy
```

### 5.2 配置参数说明

| 参数 | 可选值 | 说明 |
|------|--------|------|
| `enable` | `true` / `false` | 开启/关闭评论 |
| `repo` | `用户名/仓库名` | GitHub 仓库 |
| `repo_id` | `R_xxxxx` | 仓库唯一标识 |
| `category` | 分类名称 | Discussion 分类 |
| `category_id` | `DIC_xxxxx` | 分类唯一标识 |
| `mapping` | `pathname` / `url` / `title` | 页面映射方式 |
| `input_position` | `top` / `bottom` | 评论框位置 |
| `theme` | `preferred_color_scheme` / `light` / `dark` | 主题 |

---

## 六、推送更新

```powershell
git add themes/arknights/_config.yml
git commit -m "feat: 启用 Giscus 留言功能"
git push origin source
```

---

## 七、验证效果

1. 打开博客任意文章
2. 滚动到文章底部
3. 应能看到 Giscus 评论区
4. 使用 GitHub 账号登录后尝试评论

---

## 八、常见问题

### Q1: 评论没有出现？

1. 确认 `giscus.enable: true`
2. 检查浏览器 Console 是否有报错
3. 确认 Giscus App 已安装到仓库
4. 确认 Discussions 已开启

### Q2: 如何关闭某篇文章的评论？

在文章 frontmatter 中添加：

```yaml
comments: false
```

### Q3: 评论数据存在哪里？

评论存储在 GitHub Discussions 中，可以直接访问仓库的 Discussions 页面查看和管理。

---

## 九、相关链接

| 资源 | 链接 |
|------|------|
| Giscus 官网 | https://giscus.app |
| Giscus GitHub | https://github.com/giscus/giscus |
