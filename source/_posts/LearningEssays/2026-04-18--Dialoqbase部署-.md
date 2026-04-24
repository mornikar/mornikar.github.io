---
title : "Dialoqbase部署"
date: 2026-04-18 08:00:00
updated: 2026-04-18 08:00:00
tags: wiki, AI部署, Dify, OpenClaw, 私有化
category : LearningEssays
source: LLM Wiki
source_path: raw\\articles\\AI部署\\Dialoqbase部署.md
---

<!-- 此文章来自 LLM Wiki: raw\articles\AI部署\Dialoqbase部署.md -->

## Dialoqbase 是一款**开源AI智能体框架**，旨在帮助用户快速构建具备**自主思考、规划与行动能力**的AI应用（如智能客服、个人助理、自动化任务系统等）。其核心用法围绕“**知识库构建**”“**模型集成**”“**任务自动化**”三大环节展开

## 1.项目地址项目申请

service_role：

https://supabase.com/dashboard/project/tnyeqmwisirlksjqasvt/settings/api-keys/legacy

我的service_role：

YOUR_SUPABASE_SERVICE_ROLE_KEY



云服务器实例化创建好后：

1.更新软件包

sudo apt update

2.sudo apt upgrade

3.安装git

sudo apt install git



4.安装项目

git clone https://github.com/aiwaves-cn/agents.git



4.1克隆项目仓库：

 git clone https://github.com/n4ze3m/dialoqbase.git



4.3CD到指定目录下

cd dialoqbase/docker



4.4编辑文件：

ls -a

sudo vim .env

然后输入OpenAI的API key，以及数据库秘钥

OpenAI key：

YOUR_OPENAI_API_KEY

i



我的数据库秘钥:



YOUR_DB_SECRET_KEY



按ESC后 :wq保存或者esc后:w!回车再:q!

然后Ctrl+s保存后，新建一个终端：



4.6安装docke：

curl -fsSL https://get.docker.com | sh



4.7安装docker compose：

sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose



4.8给二进制文件添加执行权：
sudo chmod +x /usr/local/bin/docker-compose



4.9.运行docker compose：
sudo systemctl start docker
4.10.查看是否成功运行：
sudo systemctl status docker
4.11.新建终端，重新cd到该目录下：
cd dialoqbase/docker
4.12执行程序：
docker-compose up -d



终端不要关

4.13. 回到云控制台，点击实例的名称。点开“网路与安全组”点击安全组实例，入方向点击”增加规则“，访问目的填3000端口，访问来源填0.0.0.0/0任意人访问。

然后在浏览器打开你的公网ip+:3000端口（这个冒号一定要是小写输入法下的冒号）



登录admin

admin



5.安装python虚拟环境包

sudo apt install python3.12-venv

或者sudo apt install python最新版



6.创建虚拟环境

python3 -m venv myenv



7.激活虚拟环境

source  myenv/bin/activate



8.更新pip包

pip install --upgrade pip



9.安装项目依赖(不用)

pip install ai-agents







文档著者：GT / github:morniakr.git.io
<div class="wiki-backlinks">
<h4 class="wiki-backlinks-title">🔗 反向链接</h4>
<p class="wiki-backlinks-desc">以下页面引用了本文：</p>
<ul class="wiki-backlinks-list">
  <li><a href="/2026/04/24/2026-04-24-log/">log</a></li>
</ul>
</div>