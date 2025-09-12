App 等于整个项目
# flask 的request 的是从包导入，是全局变量。怎么区分？
原理：线程控制，通过线程id来区分
```
request.remote_user
request.remote_addr
```
#  request获取方法
```
# 类型声明
mydict = None  # type:dict


# mydict.update()
# mydict.get()


@app.route('/user', methods=["get", "post"])
def hello_world():
    # ==========[request基础属性]=============
    # 请求url地址
    # print(request.url)
    # 发送请求的用户和ip
    # print(request.remote_user)
    # print(request.remote_addr)

    # 请求的方法
    # 大写的字符串
    # print(request.method)

    # 请求头信息-字典
    # print(request.headers)
    # print(request.headers["Host"])
    # print(request.headers.get("Host", "默认值"))

    # ==============[request获取请求参数]====================
    # 1.提取路径参数
    # 127.0.0.1:5000/user_id/666
    # 语法: <转换器名称:变量名称>

    # 2.提取查询字符串参数
    # 127.0.0.1:5000/user/?name=xiaoming&age=18   [get]
    # 语法：request.args  类型：字典
    # params_dict = request.args
    # print(params_dict.get("name"))
    # print(params_dict.get("age"))

    # 3.提取请求体参数
    # 127.0.0.1:5000/user  请求体字典：{"name": "james", "age": 35}  [post]
    # 语法：request.form
    # params_dict = request.form
    # print(params_dict.get("name"))
    # print(params_dict.get("age"))

    # 4.原始bytes类型参数 [了解]
    # 语法：request.data
    # print(request.data)

    # 5.提取json字符串参数
    # 127.0.0.1:5000/user/   请求体json字符串：{"name": "kobe", "age": 43}
    # 语法：request.json
    # 底层已经将json字符串转换成字典
    # params_dict = request.json
    # print(params_dict.get("name"))
    # print(params_dict.get("age"))

    # 6.提取文件类型的参数
    # 127.0.0.1:5000/user/   {"img": "文件数据"}
    # 语法：request.files
    file = request.files.get("img")  # type:FileStorage

    # 读取二进制文件数据
    # 注意：一旦读取完毕 数据被清空了
    # print(file.read())

    # 保存图片到本地
    # TODO: 图片存储到云平台
    file.save("./2.png")

    return 'Hello World!'


@app.route('/index')
def index():
    return 'index page'
```
















# 导包
```
# 1.导包
	from flask import Flask
  
# 2.创建flask应用对象app
	app = Flask(__name__)
  
# 3.自定义视图函数绑定路由信息
	@app.route('/')
	def index():
    	return 'Hello World'
 
# 4.运行flask应用程序
		 app.run()
  
# 查看路由信息属性：app.url_map
```
# 3.flask 初始化参数
```
1. __name__（重点必传）
认为当前文件所有在目录就是项目目录，会在这个目录下寻找静态文件路径（图片，js,css），模板文件路径(html)

2. static_ul_path
静态文件访问路径前缀，，默认为：/static/文件名称

3. static_folder(可以不传,知道作用就好):
静态文件存储的文件夹，，默认为 static

4.template_folder
模板文件存储的文件夹，可以不传，默认为 templates


```
# 1-app.run()的参数&配置信息读取
```
# Flask旧版本的运行方式
	通过修改app.run()函数的host，port参数，指定运行的ip地址和端口号。
# 读取配置信息
	app.config.get(key)
app.config("key")
```
2-Flask新版本(1.x)运行方案--终端运行
```
总结：
#0.代码中可以省略：app.run() 这行代码
#1.使用环境变量的形式指明那个文件需要被运行
export FLASK_APP=flask文件名称 

#3.设置运行模式：(非必须,可以不指明，默认是production生产模块）
export FLASK_ENV=production  运行在生产模式，未指明则默认为此方式
export FLASK_ENV=development 运行在开发模式 默认开启debug模式


#2.使用命令启动：默认运行在127.0.0.1:5000端口
flask run   
#2.1指明ip和端口
flask run -h 0.0.0.0 -p 8000
# 注意：FLASK_APP  FLASK_ENV  production development 固定写法 不能出错
```

# 3.路由
```
# 总结：(重点)
1.修改@app.route('路由地址', methods=['post', 'get'])的参数达到修改访问url：
	目的：不同的url引导到对应的视图函数
1.1 查询路由和视图函数的绑定关系
	 app.url_map
 
2.转换器：
	作用：提取路由url`路径`上面的参数
	语法：<参数类型:形参>
注意：参数类型`暂时`理解成对应类型
```
# 4-指定请求方式&使用 PostMan 对请求进行测试
```
# 总结：
修改请求方式：
	我们可以根据需求修改对应的请求方式，完成不同的业务需求
语法：app.route(路径,methods=["POST","GET"])
注意：methods是一个列表。请求方法大小写均可。
```
# 6.返回JSON格式数据[重点]
```
总结：
当需要给客户端返回json类型的数据的时候，可以借助jsonify函数将python字典转换成json字符串
语法格式：
	jsonify(字典)
作用：
	1.将字典转换成json字符串
	2.将返回值包装成resonse对象
	3.将·数据类型·设置成application/json格式
```



# 7-重定向
```
# 总结：
	概念：当你访问某一url路由的时候，不是给你引导到当前url对应的网页而是跳转到了另一个url对应的网页。
	
# 重定向函数：
redirect(url地址)

url_for(视图函数名称)
```



# 8-自定义响应信息
```
resp =make_response(响应体)
resp.headers[key] = value
resp.set_cookie()
resp.status_code = 200
```



# 9-状态保持-cookie
```
# 设置响应头的set_cookie字段  value必须是str/bytes类型
	response.set_cookie('per_page', '10', max_age=86400)
  
# 本质是将max_age=0
response.delete_cookie('per_page')

# 直接获取到字典形式的cookie数据
	request.cookies.get('per_page')
```



# 10 状态保持 session
```
from flask import session
session 本质不是全局变量，线程隔离，线程id区分

# 注意：flask中使用session需要设置加密混淆字符串
# 盐
app.secret_key = "saldhjhaldk(*i"

# 给flask中的session设置有效时长 [1天]
# flask默认是：31天过期
app.permanent_session_lifetime = timedelta(days=1)

session["user_name"] = "laowang"
# 运行设置有效时长
session.permanent = True

# 删除session
# session.pop(key) 删除一条
# session.clear() 删除全部

```
# 11-JWT

# 12-异常处理
```
abort(http错误状态码)
# 捕获http错误
@app.errorhandler(404)

# 还可以捕获系统内置错误
@app.errorhandler(ZeroDivisionError)
```





# 请求钩子[重点]
```
总结：
1.当访问一路由：127.0.0.1：5000/  浏览器会发送一个请求给flask后端： request 
2.当请求发送过来的时候有四个时机：
	1.第一次请求之前 before_first_request
	2.每次请求之前 before_request
	3.每次请求之后 after_request
	4.每次请求之后是否有错误 teardown_request
	

@app.before_request 
    执行时机：每一次请求之前触发，视图函数执行之前触发
    作用：拦截请求，封ip，token用户权限认证

@app.before_first_request
    执行时机：项目第一次启动就会触发，而且仅会执行一次
    作用：项目初始化工作

@app.after_request
    执行时机：每次在视图函数执行完毕的时候触发[没有错误]，要接受一个响应对象
    作用：拦截响应，设置cookie，设置响应状态码 响应头信息
    
@app.teardown_request
    执行时机：每次在视图函数执行完毕后触发[无论是否有错误], 接受一个异常对象
    作用：异常处理，收尾工作

```
# 数据库配置：
```
1. 用工厂方法在app下的__init__.py下创建链接
```



















 























