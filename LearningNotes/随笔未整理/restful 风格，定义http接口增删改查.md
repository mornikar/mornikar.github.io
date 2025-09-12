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