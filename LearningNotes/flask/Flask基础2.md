
#  列表提取与元组提取注意点：
如果是底层配置需求（有错需要警告的话）就用方法['']提取，空就会报错
如果是无关大雅的外层需求，可以用get.('')来提取，空也不会报错




# 蓝图（注意避免循环导包）
```
from flask import Blueprint, url_for
# 1.创建蓝图对象
home_bp = Blueprint("hone", __name__, url_prefix = '/home')

# 在蓝图中使用钩子函数[作用域：整个home模块]

@home_bp.before_request
def process_request():
	print ("before_request调用了")

from .views import *
```



# 上下文(数据容器)
```
1.请求上下文:request, session
def hello_world():
    # =======[请求上下文]==========
    print(request.url)

    session["username"] = "xiaoming"
    print(session.get("username"))

2.应用上下文:current_app

    # ========[应用上下文]============
    # current_app == app 当前运行的app
    # 别的模块不方便导入app，够不着app的时候可以current_app
    print(app.config.get("JSON_AS_ASCII"))
    print(app.config.get("SECRET_KEY"))

    print(current_app.config.get("JSON_AS_ASCII"))
    print(current_app.config.get("SECRET_KEY"))
理解：1.上下文不是全局变量，web是并发调用，全局变量是线程共享
2.上下文是线程隔离（LocalStack类型, 本质是字典）

# 问题
在Flask程序未运行的情况下，调试代码时需要使用current_app、g、request这些对象，会不会有问题？该如何使用？

# 解决方案
	 	手动开启应用上下文 【重点】
     with app.app_context():
            current_app
        
    手动开启请求上下文
    with app.request_context(environ): 

    
 # 模拟解析客户端请求之后的wsgi字典数据
    environ = {'wsgi.version':(1,0), 'wsgi.input': '', 'REQUEST_METHOD': 'GET', 'PATH_INFO': '/', 'SERVER_NAME': 'itcast server', 'wsgi.url_scheme': 'http', 'SERVER_PORT': '80'} 


```



# g对象与请求钩子的综合案例
```
# 需求：构建用户身份认证机制
# 1.每次进入视图函数之前对用户身份进行认证(jwt session cookie)，
将用户信息保存到g对象中，方便在别的函数使用用户信息
# 2.对于特定视图可以提供强制要求用户登录的限制

# 分析
    每次进入视图函数之前对用户身份进行认证，并保存用户信息 --> 钩子函数
    提供强制要求用户登录的限制 ---> 装饰器
   
# 数据如何传递？
	g对象

# 执行流程：
发送请求 --> 钩子函数(登录使用g变量保存用户信息，没有登录g变量保存None) --> 视图函数
发送请求 --> 钩子函数 --> 装饰器  --> 视图函数 --> 获取用户信息
```


g对象与请求钩子
```
from flask import Flask, session, g, request
import functools

app = Flask(__name__)
app.secret_key = "alksdjalkdjlkas***"


# 需求：限制视图函数的访问权限
# eg: 个人中心，评论，点赞接口必须先登录，才能访问视图函数
# 方案：在钩子函数中统一提取用户信息，并且使用g变量存储，再将用户是否登录的业务逻辑代码封装到装饰器中[减少代码冗余]
@app.before_request
def get_userinfo():
    # 注意：必须用get获取字典的键值对信息
    g.user_id = session.get("user_id")
    g.user_name = session.get("user_name")

    # TODO:
    # token = request.headers.get("token")
    # token校验 -- payload -- 用户信息 -- 登录装饰器判断是否登录 -- 视图函数


# 主动寻求装饰
# app.before_request(get_userinfo)


# 登录装饰器
def login_required(view_func):
    # 防止装饰器修改被装饰函数名和文档信息
    @functools.wraps(view_func)
    def wrapper(*args, **kwargs):
        # 判断用户是否登录
        if g.user_id and g.user_name:
            # 进入视图函数
            return view_func(*args, **kwargs)
        else:
            # 未登录
            return "invliad user", 401

    return wrapper


@app.route('/login')
def login():
    # 状态保持
    session["user_id"] = 66
    session["user_name"] = "james"

    return 'login success'


@app.route('/index')
def index():
    # 提取用户信息
    if g.user_id and g.user_name:
        return "欢迎回来：{} ".format(g.user_name)
    else:
        return '<a href="/login">去登录</a>'


# 注意：装饰顺序 先构建请求，再判断是否有登录
@app.route('/profile')
@login_required
def profile():
    # 判断用户是否有登录
    print(g.user_name)
    return "profile page"


@app.route('/comment')
@login_required
def comment():
    # 判断用户是否有登录
    print(g.user_name)
    return "profile page"


if __name__ == '__main__':
    app.run(debug=True, port=8000)

```
# 工厂方法
```
# 需求：将app创建封装到工厂方法中
def create_app(config_name):
    # 1.创建app
    app = Flask(__name__)

    # 2.读取配置类中的配置信息
    config_class = config_dict[config_name]
    app.config.from_object(config_class)

    # 3.读取环境变量中私有配置信息
    # 后加载的同名配置信息会覆盖之前的配置信息
    app.config.from_envvar("CONFIG", silent=True)

    # 4.返回app
    return app


# 开发模式下的app对象
app = create_app("dev")
```

配置文件
```
# 使用面向对象的方式封装多套配置信息
class BaseConfig(object):
    """
    配置类基类
    以类属性的方式添加配置信息
    """
    DEBUG = True
    SECRET_KEY = "python666"


class DevelopmentConfig(BaseConfig):
    """开发阶段配置信息"""
    DEBUG = True

    # redis 配置信息 【自定义】
    REDIS_HOST = "127.0.0.1"
    REDIS_PORT = 6379


class ProductionConfig(BaseConfig):
    """上线配置信息"""
    # 减少io 减少服务器压力
    DEBUG = False

    # redis 配置信息 【自定义】
    REDIS_HOST = "192.168.1.3"
    REDIS_MASTER_PORT = 6379
    REDIS_SLAVE_PORT = 6380


class TestingConfig(BaseConfig):
    """测试配置信息"""
    # 提示代码错误
    Testing = True

    # redis 配置信息
    REDIS_HOST = "127.0.0.1"
    REDIS_PORT = 6379


# 暴露外界调用的接口
config_dict = {
    "dev": DevelopmentConfig,
    "pro": ProductionConfig,
    "test": TestingConfig
}


```


# 单例设计模式
```
class Singleton(object):

    # 对象初始化
    # def __init__(self):
    #     pass

    # cls == Singleton
    def __new__(cls, *args, **kwargs):
        # 第一次：cls上没有_instance 进入if判断创建对象
        # 以后的每一次：cls上有instance 返回的是第一次创建的对象
        if not hasattr(cls, "_instance"):
            # 第一次类中没有_instance属性 进入if判断，创建对象，保存_instance属性中
            # super(Singleton, cls).__new__(*args, **kwargs) 调用父类的__new__创建对象
            # 动态属性赋值
            cls._instance = super(Singleton, cls).__new__(cls, *args, **kwargs)

        return cls._instance

```














