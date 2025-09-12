本地的镜像推送到DockerHub上，这里的xianhu要和登录时的username一致：[root@xxx ~]# docker push xianhu/centos:git    # 成功推送
[root@xxx ~]# docker push xxx/centos:git    # 失败
The push refers to a repository [docker.io/xxx/centos]
unauthorized: authentication required


以后别人就可以从你的仓库中下载合适的镜像了。

[root@xxx ~]# docker pull xianhu/centos:git

## 创建容器之后做更改，之后commit生成镜像，然后push到仓库中。
更新Dockerfile。在工作时一般建议这种方式，更简洁明了。



# 创建一个用于Flask开发的Python环境，包含Git、Python3、Flask以及其他依赖包等。

[root@xxx ~]# docker pull centos
[root@xxx ~]# docker run -it centos:latest /bin/bash
# 此时进入容器，安装Python3、Git、Flask及其依赖包等，安装完成后exit退出
[root@xxx ~]# docker commit -m "Flask" -a "xianhu" container_id xianhu/flask:v1
[root@xxx ~]# docker push xianhu/flask:v1

作者：笑虎
链接：https://zhuanlan.zhihu.com/p/23599229
来源：知乎
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。