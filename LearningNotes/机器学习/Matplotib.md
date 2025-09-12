# 中文显示
```
from pylab import mpl
mpl.rcParams["font.sans-serif"]=["SimHei"]
mpl.rcParams["axes.unicode_minu"]= False

```
# 添加网格显示
```
plt.grid(True, linestyle="--",alpha=0.5)
```

# 添加描述信息
```
plt.xlable("时间")
plt.ylable("温度")
plt.title("中午的温度变化图"，fontsize=20)
```
# 图像保存
```
plt.savefig("test.png")
```
画图流程
```
import matplotlib.pyplot as plt
import random
from pylab import mpl

# 设置显示中文字体
from pylab import mpl
mpl.rcParams["font.sans-serif"] = ["SimHei"]
# 设置正常显示符号
mpl.rcParams["axes.unicode_minus"] = False

# 0.准备数据
x = range(60)
y_shanghai = [random.uniform(15, 18) for i in x]

# 1.创建画布
plt.figure(figsize=(20, 8), dpi=100)

# 2.绘制图像
plt.plot(x, y_shanghai)

# 2.1 添加x,y轴刻度
# 构造x,y轴刻度标签
x_ticks_label = ["11点{}分".format(i) for i in x]
y_ticks = range(40)

# 刻度显示
plt.xticks(x[::5], x_ticks_label[::5])
plt.yticks(y_ticks[::5])

# 2.2 添加网格显示
plt.grid(True, linestyle="--", alpha=0.5)

# 2.3 添加描述信息
plt.xlabel("时间")
plt.ylabel("温度")
plt.title("中午11点--12点某城市温度变化图", fontsize=20)

# 2.4 图像保存
plt.savefig("./test.png")

# 3.图像显示
plt.show()

```

# 一图多线
多次plot
```
# 增加北京的温度数据
y_beijing = [random.uniform(1, 3) for i in x]

# 绘制折线图
plt.plot(x, y_shanghai)
# 使用多次plot可以画多个折线
plt.plot(x, y_beijing, color='r', linestyle='--')
```
# 各图形及其语法
折线图
```
api: plt plot(x,y)
```
散点图
```
api: plt.scatter(x,y)
```

柱状图
```
api：plt.bar(x, width, align='center', **kwargs)
Parameters:    
x : 需要传递的数据

width : 柱状图的宽度

align : 每个柱状图的位置对齐方式
    {‘center’, ‘edge’}, optional, default: ‘center’

**kwargs :
color:选择柱状图的颜色dadatwer
```
直方图
```
api: matplotilb.pyplot.hist(x,bins=None)
Parameters:    
x : 需要传递的数据
bins : 组距
```
饼图
```
api: plt.pie(x,labels=,atuopct=,colors)
Parameters:  
x:数量，自动算百分比
labels:每部分名称
autopct:占比显示指定%1.2f%%
colors:每部分颜色

```
