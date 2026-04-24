---
title : "Restful风格HTTP接口"
date: 2026-04-18 08:00:00
updated: 2026-04-18 08:00:00
tags: wiki, Web, HTTP, REST
category : AIGC笔记随笔
source: LLM Wiki
source_path: raw\\skills\\web\\Restful风格HTTP接口.md
---

<!-- 此文章来自 LLM Wiki: raw\skills\web\Restful风格HTTP接口.md -->

查询书本列表数据
get + /books/
请求方式 GET
请求路径 /books/
请求参数 无
请求返回 json
```
class Books(view):
	def get(self, request):
  		books = books.objects.all()
  		book_list = []
  		fro book in books:
    			book_list.addend({
        		'id': book.id,
        		'btitle' : book.btitle,
    		})
    		context ={
        		'book_list'： book_list
        	}
   	return JsonResopnse(context, safe =False)
```
post+ /books/
请求方式 POST
请求路径 /books/
请求参数 data
请求返回 json
```
def post(self, request):
	#提取参数
	books_info = json.loads(request.body.decode())
	btile = books_info.get('btile')
	bp = books.get('bp')
	#校验
	if not ([bp,btile]):
		reutrn JsonResopnse({'errmsg': '缺少必传字段'}, status = 400)
	if len(btile)>20:
		return JsonResposne({'errmsg': '名字过长'})
	#逻辑业务
	try:
		book = BookInfo.objects.create(**book_info)
	except Exception as e:
		return ({'errmsgg': '内部错误'})
	#构建返回--restful风格约定更新或者新建之后一定要吧最新资源返回
	return JsonResopnse({
		'id': book.id
})
```
<div class="wiki-backlinks">
<h4 class="wiki-backlinks-title">🔗 反向链接</h4>
<p class="wiki-backlinks-desc">以下页面引用了本文：</p>
<ul class="wiki-backlinks-list">
  <li><a href="/2026/04/24/LearningNote/2026-04-24-log/">log</a></li>
</ul>
</div>