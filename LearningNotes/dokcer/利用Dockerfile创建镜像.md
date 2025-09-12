说明该镜像以哪个镜像为基础
FROM centos:latest

# 构建者的基本信息
MAINTAINER xianhu

# 在build这个镜像时执行的操作
RUN yum update
RUN yum install -y git

# 拷贝本地文件到镜像中
COPY ./* /usr/share/gitdir/

有了Dockerfile之后，就可以利用build命令构建镜像了：

[root@xxx ~]# docker build -t="xianhu/centos:gitdir" .

上就是构建自己镜像的两种方法。其中也涉及到了容器的一些操作。如果想删除容器或者镜像，可以使用rm命令，注意：删除镜像前必须先删除以此镜像为基础的容器。[root@xxx ~]# docker rm container_name/container_id
[root@xxx ~]# docker rmi image_name/image_id

[root@xxx ~]# docker save -o centos.tar xianhu/centos:git    # 保存镜像, -o也可以是--output
[root@xxx ~]# docker load -i centos.tar    # 加载镜像, -i也可以是--input

作者：笑虎
链接：https://zhuanlan.zhihu.com/p/23599229
来源：知乎
著作权归作者所有。商业转载请联系作者获得授权，非商业转载请注明出处。