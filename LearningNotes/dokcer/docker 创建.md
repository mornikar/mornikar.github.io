docker run -itd --name mysql -p 3306:3306 -e MYSQL_ROOT_PASSWORD=1548324254 mysql/mysql-server



docker run -p 3306:3306 --name mysql ^
-v /d/mysql/docker-mysql/conf:/etc/mysql ^
-v /d/mysql/docker-mysql/logs:/var/log/mysql ^
-v /d/mysql/docker-mysql/data:/var/lib/mysql ^
-e MYSQL_ROOT_PASSWORD=1548324254 ^
-d mysql/mysql-server







---------------------------------------------------
拉取镜像  
docker pull mysql:5.7
创建容器并映射路径 
docker run -p 3306:3306 --name mysql ^
-v /e/mysql/docker-mysql/conf:/etc/mysql ^
-v /e/mysql/docker-mysql/logs:/var/log/mysql ^
-v /e/mysql/docker-mysql/data:/var/lib/mysql ^
-e MYSQL_ROOT_PASSWORD=123456 ^
-d mysql:5.7

^为win cmd 中的换行符   -v宿主机路径：mysql路径  
/e/mysql/docker-mysql/conf 路径代表win中 E:\mysql\docker-mysql\conf
MYSQL_ROOT_PASSWORD=123456  代表root密码

linux中路径映射为：

sudo docker run -p 3306:3306 --name mysql \
-v /usr/local/docker/mysql/conf:/etc/mysql \
-v /usr/local/docker/mysql/logs:/var/log/mysql \
-v /usr/local/docker/mysql/data:/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD=123456 \
-d mysql:5.7


进入容器，进入mysql ，修改远程访问权限
docker exec -it mysql bash   进入容器
mysql -u root -p    进入mysql
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' IDENTIFIED BY '123456' WITH GRANT OPTION;   
flush privileges;   刷新权限
exit 退出mysql  exit  退出容器
宿主机连接mysql

 

 

Docker常用命令
新建容器

docker run -d --name 自定义容器名 镜像ID或镜像名
展示当前运行的容器

docker ps
展示所有容器

docker ps -a
展示所有本地镜像

docker images
运行容器

docker start 容器名或容器ID
停止运行容器

docker stop 容器名或容器ID
删除容器

docker rm -f 容器名或容器ID
进入容器内容bash

docker exec -it 容器名或容器ID bash
#退出容器命令:exit
查看容器ip

docker inspect 容器名或id
关闭docker服务

systemctl stop docker
关闭docker服务

docker inspect mycentos3
重要  重要  重要
在win上别忘了加路径：

 