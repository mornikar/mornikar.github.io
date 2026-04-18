---
title: "Dify工作流搭建"
type: entities
tags: [AI部署, Dify, OpenClaw, 私有化]
created: 2026-04-18
updated: 2026-04-18
---
解决Dify与本地模型兼容性问题的**最优解之一**，彻底绕过原生节点的`model.mode`校验限制，同时规避你之前遇到的ASCII编码错误。以下是具体操作细节和注意事项：

* * *

### 一、方案核心逻辑

原生问题分类器节点强制要求`model.mode`字段，而本地模型（如通过`stvlynn/lms`接入的）可能未被Dify正确识别为`chat`模式。用HTTP请求节点直接调用本地模型API，**完全脱离Dify的原生模型封装层**，从根源解决问题。

* * *

### 二、操作步骤细化

1. **删除原问题分类器节点**：避免原生节点的校验逻辑干扰。

2. **配置HTTP请求节点**：
   
   * **URL**：填写本地模型API地址（如`http://localhost:8000/v1/chat/completions`；若Dify是Docker部署，需用`http://host.docker.internal:8000/v1/chat/completions`访问宿主机服务）。
   
   * **Headers**：必须添加`Content-Type: application/json; charset=utf-8`（解决你之前的ASCII编码错误，确保中文Prompt能被正确序列化）。
   
   * **Body**：严格遵循OpenAI规范（示例）：
        {
     
          "model": "your-local-model",
          "messages": [
            {"role": "system", "content": "你是一个分类器，请将用户输入分为：A. 闲聊 B. 查知识库 C. 写代码。只返回字母。"},
            {"role": "user", "content": "&#123;&#123;#start.user_input#&#125;&#125;"}
          ],
          "max_tokens": 5,
          "temperature": 0.1
     
        }

3. **添加条件分支节点**：解析HTTP返回的`choices[0].message.content`（如"A"/"B"/"C"），根据结果路由到不同下游链路（如闲聊走聊天模型，查知识库走RAG流程）。

这是解决Dify与本地模型兼容性问题的**最优解之一**，彻底绕过原生节点的`model.mode`校验限制，同时规避你之前遇到的ASCII编码错误。以下是具体操作细节和注意事项：

* * *

### 一、方案核心逻辑

原生问题分类器节点强制要求`model.mode`字段，而本地模型（如通过`stvlynn/lms`接入的）可能未被Dify正确识别为`chat`模式。用HTTP请求节点直接调用本地模型API，**完全脱离Dify的原生模型封装层**，从根源解决问题。

* * *

### 二、操作步骤细化

1. **删除原问题分类器节点**：避免原生节点的校验逻辑干扰。

2. **配置HTTP请求节点**：
   
   * **URL**：填写本地模型API地址（如`http://localhost:8000/v1/chat/completions`；若Dify是Docker部署，需用`http://host.docker.internal:8000/v1/chat/completions`访问宿主机服务）。
   
   * **Headers**：必须添加`Content-Type: application/json; charset=utf-8`（解决你之前的ASCII编码错误，确保中文Prompt能被正确序列化）。
   
   * **Body**：严格遵循OpenAI规范（示例）：
        {
     
          {
           "model": "qwen/qwen3.5-9b@q4_k_m",
           "input": "你是一个分类器，请将用户输入分为：A. 闲聊 B. 查知识库 C. 写代码。只返回字母。\n\n用户输入：&#123;&#123;#start.user_input#&#125;&#125;",
           "temperature": 0.1
         }
     
        }

3. **添加条件分支节点**：解析HTTP返回的`choices[0].message.content`（如"A"/"B"/"C"），根据结果路由到不同下游链路（如闲聊走聊天模型，查知识库走RAG流程）。

* * *

### 三、方案优势

| 优势     | 说明                                                       |
| ------ | -------------------------------------------------------- |
| 彻底解耦   | 不依赖Dify的原生模型适配，只要本地模型支持OpenAI格式API就能用。                   |
| 避免编码错误 | 手动控制Body编码为UTF-8，解决你之前遇到的`'ascii' codec can't encode`问题。 |
| 性能提升   | 省去Dify原生节点的封装层消耗，响应速度更快。                                 |
| 灵活性强   | 可自定义Headers（如鉴权）、调整请求参数（如`max_tokens`），适配任何本地模型。         |

* * *

### 四、注意事项

* 若本地模型需要鉴权，在Headers中添加`Authorization: Bearer YOUR_TOKEN`。

* 测试时先用手动输入（如`{"content": "你好"}`）验证API连通性，再接入Dify变量。

* 若HTTP请求仍报错，检查本地模型日志（如FastAPI/Uvicorn日志），确认是否接收到正确请求。





在 Dify 的 **HTTP 请求节点**​ 中，**Params**​ 通常指的是 **URL Query Parameters**（URL 参数，即 `?key=value`的部分）。

针对你正在配置的 **本地模型分类器**，绝大多数情况下：

### ✅ 结论：Params 留空（不需要填）

因为你的请求体（Body）已经是标准的 JSON 格式，参数主要通过 Body 传递。

### 📋 正确的填写姿势

#### 1. **Params 栏（通常留空）**

| Key   | Value | 说明        |
| ----- | ----- | --------- |
| _(空)_ | _(空)_ | **直接留空**​ |

只有在你的本地模型 API **强制要求**​ URL 参数时才填，例如：
    http://192.168.153.1:1234/api/v1/chat?api_key=xxx

这种情况下：

* **Key**: `api_key`

* **Value**: `xxx`

* * *

#### 2. **Headers 栏（必须填）**

这是**最容易出错的地方**，一定要填：

| Key            | Value                             |
| -------------- | --------------------------------- |
| `Content-Type` | `application/json; charset=utf-8` |

⚠️ **特别注意**：

`charset=utf-8`是解决你之前 `'ascii' codec can't encode`错误的**关键**。

* * *

#### 3. **Body 栏（核心逻辑）**

选择 **Raw**，填入 JSON：
    {
      "model": "http://192.168.153.1:1234/api/v1/chat",
      "messages": [
        {
          "role": "system",
          "content": "你是一个分类器，请将用户输入分为：A. 闲聊 B. 查知识库 C. 写代码。只返回字母。"
        },
        {
          "role": "user",
          "content": "&#123;&#123;#start.user_input#&#125;&#125;"
        }
      ],
      "max_tokens": 5,
      "temperature": 0.1
    }



这是因为：

* Dify 默认用 ASCII 编码序列化 HTTP Body

* 你的 Prompt 包含中文

* **没有显式声明 `charset=utf-8`**

✅ 加上 `Content-Type: application/json; charset=utf-8`后，问题会消失。

* * *

### ✅ 最终 Checklist（100% 可用）

| 项          | 值                                               |
| ---------- | ----------------------------------------------- |
| Method     | POST                                            |
| URL        | `http://192.168.153.1:1234/api/v1/chat`         |
| Headers    | `Content-Type: application/json; charset=utf-8` |
| Body       | ✅ JSON                                          |
| model      | ✅ **真实模型名**​                                    |
| input      | ✅ 字符串                                           |
| max_tokens | ❌ 删除                                            |


