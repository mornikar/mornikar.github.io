---
title: "Skill封装与优化"
type: entities
tags: [AI部署, Dify, OpenClaw, 私有化]
created: 2026-04-18
updated: 2026-04-18
---
# Skill封装与组成：

### 1.skill.md =员工手册

```

    我叫什么：skill的名称和定位
    我负责什么：触发场景和职责范围


    收到指令→分析→执行→输出


    做事标准：格式、质量、输出规范



    每次工作确立职责，不需要重头教
```

### 2.references =AI规范列表

```

    格式标准：表格列宽、字段顺序


    内容规范：必填项、禁用词



    行业规范：报销凭证要求



    视觉规范：字体、颜色、间距



    文件命名：日期_公司_金额

```

### 3.scipts/ =脚本自动化代码

```

    自动读取发票并且识别文字


    自动格式化输出表格结果



    自动按规则重命名文件



    自动校验数据完整性

```

### 4.assets/ = 每次输出用到的模板文件

```

    ppt模板：品牌色、字体、板式


    报告格式文件：固定结构和排版



    公司logo：统一标准尺寸



    字体文件 ：指定字体和字号规范



```

### 封装方法：

对话式封装：

## Skill打包提示词

```

    我们刚才的对话已经磨合出了完整的工作流程和输出标准。
    请现在讲这个过程整理成一个标准的AgentSkill，要求如下：

    1.创建完整的Skill文件夹结构

    2.SKILL.md写清楚Skill职责、触发场景、执行步骤、输出标准

    3.references 放入我们确认过的所有格式要求和内容标准

    4.可自动化的步骤写入 scripts






```





## Skill提示词优化：

    根据我的工作习惯优化这个skill
    
    我的具体要求是......
    
    直接迭代skill











# **Skill下载大全：**



## 电商：



亚马逊自动化：

```
安装方式：Curl https://lobehub.com/skills/composiohq-awesome-claude-skills-amazon-automation/skill.md, then follow the instructions to set up LobeHub Skills Marketplace and install the skill. Once installed, read the SKILL.md file in the installed directory and follow its instructions to complete the task.

或者：
npx -y @lobehub/market-cli skills install composiohq-awesome-claude-skills-amazon-automation --agent claude-code

------------------------------------------------------------------------------
通过 Rube MCP 实现亚马逊自动化
通过 Composio 的 Amazon 工具包和 Rube MCP 实现 Amazon 操作自动化。

工具包文档：composio.dev/toolkits/amazon

先决条件
必须连接 Rube MCP（RUBE_SEARCH_TOOLS 可用）
RUBE_MANAGE_CONNECTIONS通过工具包激活亚马逊连接amazon
务必RUBE_SEARCH_TOOLS先致电获取当前工具架构。
设置
获取 Rube MCP：https://rube.app/mcp在客户端配置中添加其作为 MCP 服务器。无需 API 密钥——只需添加端点即可。

RUBE_SEARCH_TOOLS通过确认响应来验证 Rube MCP 是否可用。
RUBE_MANAGE_CONNECTIONS使用工具包进行通话amazon
如果连接未激活，请点击返回的身份验证链接完成设置。
运行任何工作流程之前，请确认连接状态显示为“活动”。
工具发现
在执行工作流程之前，务必先了解可用的工具：

*。TXT
纯文本
RUBE_SEARCH_TOOLS
queries: [{use_case: "Amazon operations", known_fields: ""}]
session: {generate_id: true}
这将返回可用的工具别名、输入模式、推荐的执行计划和已知陷阱。

核心工作流程模式
第一步：发现可用工具
*。TXT
纯文本
RUBE_SEARCH_TOOLS
queries: [{use_case: "your specific Amazon task"}]
session: {id: "existing_session_id"}
步骤 2：检查连接
*。TXT
纯文本
RUBE_MANAGE_CONNECTIONS
toolkits: ["amazon"]
session_id: "your_session_id"
步骤 3：执行工具
*。TXT
纯文本
RUBE_MULTI_EXECUTE_TOOL
tools: [{
  tool_slug: "TOOL_SLUG_FROM_SEARCH",
  arguments: {/* schema-compliant args from search results */}
}]
memory: {}
session_id: "your_session_id"
已知陷阱
务必先进行搜索：工具架构会发生变化。切勿在未调用的情况下硬编码工具别名或参数。RUBE_SEARCH_TOOLS
检查连接：RUBE_MANAGE_CONNECTIONS在执行工具之前，请确认连接状态显示为“活动”。
模式合规性：使用搜索结果中完全相同的字段名称和类型
内存参数：始终包含memory在RUBE_MULTI_EXECUTE_TOOL调用中，即使为空（{}）
会话重用：在工作流中重用会话 ID。为新的工作流生成新的会话 ID。
分页：检查响应中是否存在分页标记，并继续获取数据直至完成。
快速参考
手术    方法
查找工具    RUBE_SEARCH_TOOLS以亚马逊特定用例为例
连接    RUBE_MANAGE_CONNECTIONS工具包amazon
执行    RUBE_MULTI_EXECUTE_TOOL发现工具碎片
批量操作    RUBE_REMOTE_WORKBENCH和run_composio_tool()
完整方案    RUBE_GET_TOOL_SCHEMAS用于工具schemaRef
```





跨境电商文案（亚马逊/Shopee）含A+内容框架+分镜视频脚本

```

aills名字：product-listing-generator
安装：
Curl https://lobehub.com/skills/bytesagain-ai-skills-product-listing-generator/skill.md, then follow the instructions to set up LobeHub Skills Marketplace and install the skill. Once installed, read the SKILL.md file in the installed directory and follow its instructions to complete the task.

或者：
npx -y @lobehub/market-cli skills install bytesagain-ai-skills-product-listing-generator --agent claude-code


摘要
产品上架文案生成器，通过本地脚本（scripts/product.sh）快速生成符合各平台规范的电商文案。功能覆盖标题变体、卖点要点、完整商品描述、SEO关键词（核心/长尾/相关）、竞品对比、跨境电商A+框架、短视频分镜脚本、12条高频FAQ、组合套装文案、标题优化诊断与用户痛点挖掘等模块。generate 命令可自动按淘宝、拼多多、Amazon 与 Shopify 风格适配输出（表情与促销语言、价格导向表达、功能要点或品牌故事）。适用于新品上架、listing 优化、跨境开店、短视频内容制作与客服知识库建设。核心优势是不依赖外部 API 的本地化模板化生成：速度快、风格统一，且便于按平台与语气定制以提升转化率







```

文档著者：GT / github:morniakr.git.io


