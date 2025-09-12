# DRF框架就是RestFramework框架（rest_framework[导入的方式]）
- REF开发模式：	前后端分离模式开发的
 - - RESTful
 - 域名
  接口设计方法：【大型服务部署放在专有域名下（整个服务器提供此类服务）】
 ```
	https://api.example.com
```
小型 子应用：
```
https://example.org/api/
```


- 版本（在app后面放版本号）
```
https://www.example.com/api/1.0/foo
```
- 路径(名词，复数)
遵循restful风格：/books/

- #请求动作
- 没pk（id）：
get + /books/ ==> 获取全部对象
post + /books/ ==> 新建一数据

- 有pk：
get + /books/ ==> 获取单一对象
put + /books/ ==> 更新单一对象
delete + /bookds/ ==> 删除单一对象

- 过滤参数
 过滤的参数一般是放在查询字符串中携带
- 过滤的参数一般放在查询字符串中携带
查询字符串 = page
```
get + /books/?page=1&page_size = 5
分页就是过滤，根据page个page_size查询字符串参数去分页（过滤）
```

- 状态码
```
200 获取数据成功
201 新建、更新成功
400 后端校验参数错误
401  没身份（匿名用户）
403  没有权限
404 资源找不到 
1（路由错了，路由映射错了）
2 （根据pk查询数据库找不到）
405 请求方式不被允许
（视图类没有重写视图方法）
500 后端代码错误
```