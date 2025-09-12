# 1. 蓝图（注意避免循环导包）

# 2. 工厂方法

# 3. 单例设计模式

# 4. 取消ascii（啊斯卡编码）
```
# 在flask_restful中取消中文转换成ascii编码
app.config["RESTFUL_JSON"] = {"ensure_ascii": False}

# 在flask框架中
app.config["JSON_AS_ASCII"] = Flask
```
# 所有装饰器装饰顺序为靠近函数的先执行
内容执行顺序从上到下

# 工厂模式链接数据库
```
from flask import Flask
from settings import config_dict
from flask_sqlalchemy import SQLAlchemy

# 数据库的第二种创建方式：
# 创建数据库对象，但是还未关联app对象，不会执行init_app方法进行初始化操作,等待工厂方法创建出app对象，再延后关联
# db数据库必须定义成全局变量，方便别的模块调用
db = SQLAlchemy()



# 设计模式：MVC MVT MVVM 工厂设计模式，单例设计模式，中间人设计思想-生产者消费者模式，装饰器模式,...
# https://yq.aliyun.com/topic/122
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

    # 懒加载 延后加载
    db.init_app(app)

    # 4.返回app
    return app


# 开发模式下的app对象
app = create_app("dev")

# 生产模式下的app对象
# app = create_app("pro")

print(db)


@app.route('/')
def hello_world():
    print(app.config["REDIS_HOST"])
    return 'Hello World!'


if __name__ == '__main__':
    app.run(debug=True, port=8000)

```
# 用装饰器拦截放回字典定制json格式
```
from flask import Flask
from flask_restful import Api, Resource

app = Flask(__name__)

# 1.将app对象包装创建api对象 [用于管理类视图(资源)]
api = Api(app)

"""
需求：
{
    "name": "james",
    "team": "lakers"
}

定制返回的json格式：
{
    "message": "OK" 或 "ERROR Message",
    "data": {
            "name": "james",
            "team": "lakers"
    }
}

方案1：修改底层output_json的源代码 [不推荐]
    # json定制化
    if "message" not in data:
        data = {
            "message": "OK",
            "data": data
        }


方案2：使用装饰器拦截返回的字典，定制json格式，返回响应 [推荐]
"""
from utils import output_json
# 主动寻求装饰
api.representation(mediatype="application/json")(output_json)


# 2.定义类视图  继承Resource
class DemoResource(Resource):

    def get(self):
        # 类视图响应的content-type默认变为json形式
        # 类视图的返回值可以是字典, 会被自动转为json字符串
        my_dict = {
            "name": "james",
            "team": "lakers"
        }
        return my_dict

    def post(self):
        my_dict = {
            "name": "james",
            "team": "lakers",
            "message": "invalid user"
        }
        return my_dict

# 3.api对象给类视图添加路由
api.add_resource(DemoResource, '/')

if __name__ == '__main__':
    print(app.url_map)
    app.run(debug=True)

```