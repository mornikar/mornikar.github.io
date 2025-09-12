进入虚拟环境
 source activate env_name 

安装命令:
 conda install pytest
搜索
 conda search pytest
安装完成后，可以用“which 软件名”来查看该软件安装的位置：
 which gatk
如需要安装特定的版本:
conda install 软件名=版本号
conda install gatk=3.7

查看已安装软件:
conda list

更新指定软件:
conda update gatk

卸载指定软件:
conda remove gatk


退出conda环境
. ./deactivate
# 或者用 
conda deactivate

重命名环境
conda create -n python2 --clone py2
conda remove -n py2 --all

