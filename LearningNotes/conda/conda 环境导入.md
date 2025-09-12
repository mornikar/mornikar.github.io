联网复制
1.导出已有环境
激活环境env_name(环境名称)

conda activate env_name
导出环境

conda env export --file env_name.yml
将env_name.yml复制到另一台机器上，导入

conda env create -f env_name.yml
复制到环境仅包含原来环境中使用conda install 安装的包。
2. 导入pip安装的包(需进入虚拟机环境)
导出安装库(源机器)

pip freeze > requirements.txt
导入安装库(目标机器)

pip install -r requirements.txt
离线环境
将envs目录下的env_name(环境名称)文件夹复制到目标机器上
通过以下命令导入
conda create -n env_name --clone ./env_name --offline
若显示以下结果，则表示导入成功
conda虚拟环境复制_第1张图片