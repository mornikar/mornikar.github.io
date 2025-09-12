在Mysql命令行中更改时区
# 点开最右侧 Advanced，找到 serverTimezone，在右侧value处填写 GMT，保存即可！(或填写 Asia/Shanghai)

Copy
mysql > SET time_zone = '+8:00'; # 此为北京时，我们所在东8区
Copy
mysql> flush privileges; # 立即生效

