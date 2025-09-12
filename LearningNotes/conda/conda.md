查看虚拟环境 conda info -e

2019-05-16 update: 这个道理跟家里的电视机是一样一样的，安装conda就相当于买了一台电视机，但是有电视了不意味着你就能看节目了，你要手动添加频道才能看你想看的电视节目。
官方channel: (先不要急着添加这两个哦~,只要添加下面的清华的4个镜像地址就足够了的~)：

conda config --add channels bioconda
conda config --add channels conda-forge
官方的话这两个channel应该就够了的。

2020-06-14 update：但是其实现在用国内的镜像比较多，官方的频道相较而言速度较慢。但也不是绝对的，有小伙伴跟我说他使用官方的频道也很流畅，所以见仁见智啦。另外，不建议加入大量的相同的频道，如添加了官方的bioconda之后又添加清华的bioconda镜像，没有必要，而且会拖慢速度。

2019-06-12 update：最近在装raxml-ng的时候发现了一个新的channel叫genomedk，各位也可以添加到condarc里去 👇

# 这个频道有的时候会引起网络错误, 网络不稳定的朋友不建议加.
conda config --add channels genomedk
顺便安利一个我hoptop学长的教程：如何搭建一个本地的conda镜像（包含bioconda）供各位爱折腾的高端玩家。
2019-06-17 update: 清华恢复了conda 的镜像了！详情请看下面：
Anaconda 镜像即将恢复
借花献佛给大家复习一遍如何添加清华的镜像channels: 来源 → 生信媛: 喜大普奔: Anaconda的清华镜像又可以用了

conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/free/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/pkgs/main/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/conda-forge/
conda config --add channels https://mirrors.tuna.tsinghua.edu.cn/anaconda/cloud/bioconda/
2020-06-14 update: 为了分担清华源镜像的压力，最近北京外国语大学也开启了镜像站点，同样是由清华TUNA团队维护的，如果有小伙伴遇到清华源速度很慢的情况的话，可以考虑换成北外的镜像。
新闻传送门：https://mirrors.tuna.tsinghua.edu.cn/news/bfsu-mirror/
镜像传送门：https://mirrors.bfsu.edu.cn/help/anaconda/
2020-08-05 update: 为了方便大家(当然主要是自己偷懒用), 把北外的链接也给写出来, 这样就可以直接复制粘贴了~当然两者取其一就可以了, 不用重复添加.
另外, 我查看了中科大的镜像https://mirrors.ustc.edu.cn/anaconda, 点击这个地址会直接跳转到清华tuna的镜像站点. 所以目前看起来国内是只有清华和北外两个镜像站点可用了~如果有小伙伴知道还有别的镜像可以用的话欢迎在下面留言或者私信我鸭!

conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/cloud/bioconda/
conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/cloud/conda-forge/
conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/free/
conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/main/
下面这个我没用过, 但是看起来像是R的频道, 可以添加一下试试看.
conda config --add channels https://mirrors.bfsu.edu.cn/anaconda/pkgs/r/
如果你需要其他的更多的频道,请访问这个地址👉: https://mirrors.bfsu.edu.cn/help/anaconda/ 里面有详细的指导哒

2020-08-10 update: 在生信技能树的群里由群友@合肥-生信-gzcdo 提供了两个新的conda的国内镜像源

https://mirrors.nju.edu.cn/anaconda/
https://mirrors.sjtug.sjtu.edu.cn/anaconda/

各位朋友也可以试试看这两个镜像呀!~

显示安装的频道

 conda config --set show_channel_urls yes 
查看已经添加的channels

conda config --get channels
已添加的channel在哪里查看

vim ~/.condarc
利用conda安装生物信息软件
安装命令:
 conda install gatk
搜索需要的安装包:
提供一个网址,用于事先查找想安装的软件存不存在
conda available packages
2020-06-14 update: 链接已挂，请选择用下面的conda search命令或者开头提供的更新的网址
当然, 也可以用这个命令进行搜索（会稍微慢一点）

 conda search gatk
安装完成后，可以用“which 软件名”来查看该软件安装的位置：

 which gatk
如需要安装特定的版本:
conda install 软件名=版本号
conda install gatk=3.7
这时conda会先卸载已安装版本，然后重新安装指定版本。

查看已安装软件:

conda list
更新指定软件:

conda update gatk
卸载指定软件:

conda remove gatk
退出conda环境
退出也很简单，之前我们是. ./activate 或者 (. ~/miniconda3/bin/activate)现在退出只要:

. ./deactivate
# 或者用 
conda deactivate
就退出当前的环境了

创建软件的软链接（非必须步骤）
跟着命令一路敲到这里的小旁友们估计发现了，现在退出conda环境之后之前安装的软件全都GG了，敲命令没法执行了！
怎么办呢！其实只要把安装好的软件软连接到一个处在环境变量里的位置就可以使用了。三步走：

第一步，创建一个文件夹
我一般的习惯是在/home目录下创建一个.soft文件夹
第二步，将这个文件夹添加到环境变量中
export PATH="~/.soft:$PATH"
第三步，软链接
ln -s ~/miniconda3/bin/gatk ~/.soft
这样就可以运行啦~如果还是不行建议试试初始化一下bashrc：. ./bashrc

创建conda环境（常用步骤，强烈推荐）
之前创建的时候显示的是（base）这是conda的基本环境，有些软件依赖的是python2的版本，当你还是使用你的base的时候你的base里的python会被自动降级，有可能会引发别的软件的报错，所以，可以给一些特别的软件一些特别的关照，比如创建一个单独的环境。
在conda环境下，输入conda env list（或者输入conda info --envs也是一样滴）查看当前存在的环境：

conda env list
# 这是我相当常用的一条命令了，建议记一记
目前的环境

目前只有一个base

conda create -n python2 python=2
# -n: 设置新的环境的名字
# python=2 指定新环境的python的版本，非必须参数
# 这里也可以用一个-y参数，可以直接跳过安装的确认过程。
conda会创建一个新的python2的环境，并且会很温馨的提示你只要输入conda activate python2就可以启动这个环境了


新的环境
退出环境
如上面的截图提到的，只要

conda deactivate
2019-6-28 update: 如何删除和重命名一个已存在的环境

删除环境
删除也很容易的

conda remove -n myenv --all
就可以退出当前环境。
掌握了创建和删除我们就可以实现重命名的操作了

重命名环境
实际上conda并没有提供这样的功能，但是可以曲线救国，原理是先克隆一个原来的环境，命名成想要的名字，再把原来的环境删掉即可
参考自：conda 创建/删除/重命名 环境
接下来演示把一个原来叫做py2的环境重新命名成python2：

conda create -n python2 --clone py2
conda remove -n py2 --all
骚操作：allias简化启动（非必须步骤）
image.png

linux提供了一个给大家偷懒的命令叫alias，只要在你的.bashrc里设置一下就好了，我添加了一条叫做condaup的命令，这样就可以免去每次敲. ~/miniconda/bin/dactivate的麻烦，一步搞定~技术宅改变世界！
image.png
报错信息集锦
2020-08-06 update: 我最近用conda总是发生一些奇怪的问题, 所以想把报错的信息及解决方式给收集整理一下.

报错1: 网络错误

Collecting package metadata (current_repodata.json): failed

CondaHTTPError: HTTP 000 CONNECTION FAILED for url <https://conda.anaconda.org/genomedk/linux-64/current_repodata.json>
Elapsed: -

An HTTP error occurred when trying to retrieve this URL.
HTTP errors are often intermittent, and a simple retry will get you on your way.
u'https://conda.anaconda.org/genomedk/linux-64'
一般这种问题就只要重新运行一下上一条命令就可以了. 有的时候网络不稳定而已.
