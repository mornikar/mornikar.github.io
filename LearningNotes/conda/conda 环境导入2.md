conda本身的命令里是有移植这个选项的。
假如前提是，在本地的conda里已经有一个AAA的环境，我想创建一个新环境跟它一模一样的叫BBB，那么这样一句就搞定了：

conda create -n BBB --clone AAA
1
但是如果是跨计算机呢。

其实是一样的。

查询conda create命令的原来说明，是这样的：

–clone ENV 
Path to (or name of) existing local environment.
1
2
–clone这个参数后面的不仅可以是环境的名字，也可以是环境的路径。

所以，很自然地，我们可以把原来电脑上目标conda环境的目录复制到新电脑上，然后再用：

conda create -n BBB --clone ~/path
1
就直接一步安装了所有的包，完成了环境的移植。
原来的电脑上的环境的地址可以用
conda info -e 查询到。

但是注意有个小的问题：
移植过来的环境只是安装了你原来环境里用conda install等命令直接安装的包，你用pip之类装的东西没有移植过来，需要你重新安装。











在服务器上想要使用别人搭好的环境，但是又怕自己对环境的修改更新会影响他人的使用，这个时候可以使用conda命令进行复制环境。
首先假设已经安装了Anaconda。

根据已有环境名复制生成新的环境
假设已有环境名为A，需要生成的环境名为B：

conda create -n B --clone A
1
根据已有环境路径复制生成新的环境
假设已有环境路径为D:\A，需要生成的新的环境名为B：

conda create -n B --clone D:\A
1
生成的新的环境的位置在anaconda的安装路径下，一般情况在D:\Anaconda3\envs\文件夹下。