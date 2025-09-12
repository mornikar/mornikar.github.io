虚拟环境配置
统一虚拟环境，适用于python等高级语言
环境隔离
做人工智能，深度挖掘时会用到dokcer 里嵌套安装conda
2、更新包管理镜像源：

conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/

conda config --set show_channel_urls yes

3、更新所有包：conda update --all

4、安装包：conda install xxx，
更新包：conda update xxx，
删除包：conda remove，
已安装包列表：conda list

5、创建环境：conda create -n env_name list of packages，
list of packages 是要安装在环境中的包的列表

6、创建特定版本python的环境：conda create -n py3 python=3 或 conda create -n py2 python=2 或 conda create -n py33 python=3.3
conda create --prefix="D:\\my_python\\envs\\my_py_env"  python=3.6.3

7、进入环境：activate my_env，离开deactivate

8、删除环境：conda env remove -n env_name

9、列出环境：conda env list

10、导出环境：conda env export > environment.yaml，通过环境文件创建环境：conda env create -f environment.yaml