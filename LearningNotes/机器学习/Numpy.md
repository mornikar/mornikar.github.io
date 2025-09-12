# 生成数组
```
a = np.array([[1,2,3],[4,5,6]])
# 从现有的数组当中创建
a1 = np.array(a)
# 相当于索引的形式，并没有真正的创建一个新的
a2 = np.asarray(a)
```
 关于array和asarray的不同
```
等于创建一个软链接
当数组赋值给另外一个变量后，
array：修改变量不会改变
asarray： 会跟着改变
```


生成各种不同的数组
```
生成固定范围的数组

np.linspace (start, stop, num, endpoint)
参数:
start:序列的起始值
stop:序列的终止值
num:要生成的等间隔样例数量，默认为50
endpoint:序列中是否包含stop值，默认为ture

等差数组

np.arange(start,stop, step, dtype)


参数
step:步长,默认值为1
np.arange(10, 50, 2)

等比数组

np.logspace(start,stop, num)
num:要生成的等比数列数量，默认为50

 生成随机数组
np.random   

```

正态分布创建方法
```
准正态分布中返回一个或多个样本值
np.random.randn(d0, d1, …, dn)



np.random.normal(loc=0.0, scale=1.0, size=None)

loc：float

​ 此概率分布的均值（对应着整个分布的中心centre）

scale：float

​ 此概率分布的标准差（对应于分布的宽度，scale越大越矮胖，scale越小，越瘦高）

size：int or tuple of ints

​ 输出的shape，默认为None，只输出一个值


返回指定形状的标准正态分布的数组。
np.random.standard_normal(size=None)
```

# 均匀分布
```
np.random.rand(d0, d1, ..., dn)
返回一组均匀分布的数。


从一个均匀分布[low,high)中随机采样，注意定义域是左闭右开，即包含low，不包含high.
np.random.uniform(low=0.0, high=1.0, size=None



均匀分布中随机采样，生成一个整数或N维整数数组
np.random.randint(low, high=None, size=None, dtype="l")
取数范围：若high不为None时，取[low,high)之间随机整数，否则取值[0,low)之间随机整数。



```

# 形状修改

```
返回一个具有相同数据域，但shape不一样的视图
行、列不进行互换
ndarray.reshape(shape, order)


修改数组本身的形状（需要保持元素个数前后相同）
行、列不进行互换

ndaarray.resize(new_shape)


数组的转置
将数组的行、列进行互换

ndaarray.T


```

# 类型修改
```
返回修改了类型之后的数组
stock_change.astype(np.int32)



构造包含数组中原始数据字节的Python字节
  arr = np.array([[[1, 2, 3], [4, 5, 6]], [[12, 3, 34], [5, 6, 7]]])
arr.tostring()
```
# 返回给定的形状哥类型的新数组，用0填充
numpy.zeros(shape，dtype=float，order = 'C')
```
返回给定形状和类型的新数组，用0填充。

参数：	
shape：int 或 int 的元组

 	新阵列的形状，例如：（2，3）或2。
 	dtype：数据类型，可选
 	数组的所需数据类型，例如numpy.int8。默认是numpy.float64
 	order：{'C'，'F'}，可选，默认：'C'
 	是否在内容中以行（C）或列（F）顺序存储多维数据。
返回：	out：ndarray
 	具有给定形状，类型和顺序的0的数组。


np.zeros((2,3))
Out[2]: 
array([[ 0.,  0.,  0.],
       [ 0.,  0.,  0.]])
```


分组频数计算
```
mean() 取平均值
nunique方法计算pandas Series的唯一值计算（去重）
value_counts方法获取pandas Series的频数统计

```

# to_numeric 函数
变量转换为数值类型（int，float）
```
DataFrame每一列的数据类型必须相同，当有些数据中有缺失，但不是NaN时（如missing,null等），会使整列数据变成字符串
类型而不是数值型，这个时候可以使用to_numeric处理

pd.to_numeric(tips_sub_miss['total_bill'])

to_numeric函数有一个参数errors,它决定了当该函数遇到无法转换的数值时该如何处理
默认情况下,该值为raise,如果to_numeric遇到无法转换的值时,会抛错
coerce: 如果to_numeric遇到无法转换的值时,会返回NaN
ignore: 如果to_numeric遇到无法转换的值时会放弃转换,什么都不做
pd.to_numeric(tips_sub_miss['total_bill'],errors = 'ignore')


to_numeric向下转型
to_numeric函数还有一个downcast参数, downcast接受的参数为 'integer','signed','float','unsigned'
downcast参数设置为float之后, total_bill的数据类型由float64变为float32

pd.to_numeric(tips_sub_miss['total_bill'],errors = 'coerce',downcast='float')
```

# 分类数据(category)
Pandas 有一种类别数据, category,用于对分类值进行编码
```
转换为category类型
tips['sex'] = tips['sex'].astype('str') tips.info()


```
Pandas 数据类型转换
Pandas除了数值型的int 和 float类型外，还有object ，category，bool，datetime类型
可以通过as_type 和 to_numeric 函数进行数据类型转换
Pandas 分类数据类型
category类型，可以用来进行排序，并且可以自定义排序顺序
CategoricalDtype可以用来定义顺序