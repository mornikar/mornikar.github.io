创建Series
```
import pandas as pd 
s = pd.Series(['banana',42])
```
创建DataFrame
```
name_list = pd.DataFrame(
	{
		'Name':['Tome','Bob'], 
		'Occupation':['Teacher','IT Engineer'], 
		'age':[28,36]
	}
)
```
# Series 常用操作
```
loc	使用索引值取子集
iloc 	使用索引位置取子集
dtype或dtypes Series	内容的类型
T 	Series的转置矩阵
shape 	数据的维数
size 	Series中元素的数量
values 	Series的值
.value_counts()		统计value数量
director.count() 	返回非空值
describe() 	打印描述信息
```
# Series的一些方法
```
方法 	说明
append 	连接两个或多个Series
corr 	计算与另一个Series的相关系数
cov	 计算与另一个Series的协方差
describe 计算常见统计量
drop_duplicates 	返回去重之后的Series
equals 		判断两个Series是否相同
get_values 	获取Series的值，作用与values属性相同
hist 	绘制直方图
isin Series	中是否包含某些值
min 	返回最小值
max	返回最大值
mean	返回算术平均值
median	返回中位数
mode 	返回众数
quantile 	返回指定位置的分位数
replace 	用指定值代替Series中的值
sample	 返回Series的随机采样值
sort_values 	对值进行排序
to_frame	把Series转换为DataFrame
unique 		去重返回数组
```
两个Series之间计算，如果Series元素个数相同，则将两个Series对应元素进行计算；元素不同则缺失用NaN表示

# DataFrame
```
ndim 查看数集的维度
set_index 修改索引
drop 删除列
to_pickle 保存
read_pickle 读取
to_csv  保存成csv文件
格式：('output/scientists_df.tsv',sep='\t')



to_clipboard 把数据保存到系统剪贴板，方便粘贴
to_dict 把数据转换成Python字典
to_hdf 把数据保存为HDF格式
to_html 把数据转换成HTML
to_json 把数据转换成JSON字符串
to_sql 把数据保存到SQL数据库

nlargest(100,'imdb_score')

0.1
统计数值列，并进行转置
college.describe().T

统计多方式数值
.describe()

nlargest方法显示出某列的排序
nlargest(100,'imdb_score').head()

传入一个字典
agg('key':'value')
```
# 聚合重点
agg
# 数据链接
```
concat	把dataframe(简单叠堆)
ignore_index = True	忽略后面DataFrame的索引

添加列（默认添加行）
，传入参数 axis = columns
col_concat = pd.concat([df1,df2,df3],axis=1)

向DataFrame添加一列，不需要调用函数，通过dataframe['列名'] = ['值'] 即可

```
# 链接数据库
pd.read_sql_table
从数据库中读取表，第一个参数是表名，第二个参数是数据库连接对象
```
how = ’left‘ 对应SQL中的 left outer 保留左侧表中的所有key
how = ’right‘ 对应SQL中的 right outer 保留右侧表中的所有key
how = 'outer' 对应SQL中的 full outer 保留左右两侧侧表中的所有key
how = 'inner' 对应SQL中的 inner 只保留左右两侧都有的key

转换：
to_timedelta 将Milliseconds列转变为timedelta数据类型
dt.floor('s') dt.floor() 时间类型数据，按指定单位截断数据

DataFrame的assign方法：创建新列
.assign

join合并，依据两个DataFrame的行索引，如果合并的两个数据有相同的列名，需要通过lsuffix，和rsuffix，指定合并后的列名
的前缀
stocks_2016.join(stocks_2017, lsuffix='_2016', rsuffix='_2017', how='outer')

concat, join, 和merge的区别

concat ：
Pandas函数
可以垂直和水平地连接两个或多个pandas对象
只用索引对齐
默认是外连接（也可以设为内连接）
join ：
DataFrame方法
只能水平连接两个或多个pandas对象
对齐是靠被调用的DataFrame的列索引或行索引和另一个对象的行索引（不能是列索引）
通过笛卡尔积处理重复的索引值
默认是左连接（也可以设为内连接、外连接和右连接）
merge ：
DataFrame方法
只能水平连接两个DataFrame对象
对齐是靠被调用的DataFrame的列或行索引和另一个DataFrame的列或行索引
通过笛卡尔积处理重复的索引值
默认是内连接（也可以设为左连接、外连接、右连接）
```

# 缺失数据处理
```
keep_default_na = False 关闭NaN显示
ffill 填充，用时间序列中空值的上一个非空值填充
city_day.fillna(method='ffill',inplace=True) city_day['Xylene'][50:65]
用时间序列中空值的下一个非空值填充
method='bfill'
线性差值方法
limit_direction="both"
```
# 整理数据
melt
既可以用pd.melt, 也可使用dataframe.melt()
```
frame dataframe 被 melt 的数据集名称在 pd.melt() 中使用
id_vars tuple/list/ndarray 	可选项不需要被转换的列名，在转换后作为标识符列（不是索引列）
value_vars tuple/list/ndarray 	可选项需要被转换的现有列如果未指明，除 id_vars 之外的其他列都被转换
var_name string variable 	默认值自定义列名名称设置由 'value_vars' 组成的新的 column name
value_name string value 	默认值自定义列名名称设置由 'value_vars' 的数据组成的新的 column name
col_level int/string 	可选项如果列是MultiIndex，则使用此级别

数据整理（函数自动处理）
pew_long = pd.melt(pew,id_vars='religion')
pew_long
```
# 处理查询冗余
```
对于同一首歌曲来说，歌曲信息是完全一样的，可以考虑单独保存歌曲信息
减少上表中保存的歌曲信息，可以节省存储空间，需要完整信息的时候，可以通过merge拼接数据
我们可以把year,artist,track,time和date.entered放入一个新的dataframe中

1.提取表信息，进行去重
illboard_songs = bill_borad_long[['year','artist','track','time','date.entered']] billboard_songs = billboard_songs.drop_duplicates()
billboard_songs

2.为新拆分处理出来的数据添加ID列（添加ID）
billboard_songs['id'] = range(len(billboard_songs)) 
billboard_songs

3.数据拆分成两个dataframe：billboard_songs和 billboard_ratings
取出每周评分，去掉冗余部分
billboard_ratings = bill_borad_long.merge(billboard_songs,on=['year','artist','track','time','date.entered']) billboard_ratings = billboard_ratings[['id','week','rating']] billboard_ratings

4.用merage还原数据
billboard_songs.merge(billboard_ratings,on=['id'])

```
# stack整理数据
```
用rename_axis给不同的行索引层级命名
reset_index()，将结果变为DataFrame
```
# wide_to_long整理数据
```
stubs = ['actor', 'actor_facebook_likes']
actor2_tidy = pd.wide_to_long(actor2, stubnames=stubs, i=['movie_title'], j='actor_num', sep='_').reset_index() 
actor2_tidy.head()
```
# unstack 处理数据
之前介绍了stack，unstack可以将stack的结果恢复
```
state_fruit.stack().unstack()
```


# 自定义方法
.apply(方法名)


# 向量函数
```
def avg_2_mod(x,y):
 	if(x==20): 
		return (np.NaN) 
	else:return (x+y)/2 
avg_2_mod(df['a'],df['b'])
上面函数中, x==20 , x 是向量, 但20是标量, 不能直接计算. 这个时候可以使用np.vectorize将函数向量化
使用装饰器
@np.vectorize 
def vec_avg_2_mod(x,y): 
	if(x==20):
		 return (np.NaN) 
	else:
		return (x+y)/2 
vec_avg_2_mod(df['a'],df['b'])
```
# lambda函数
```
df.apply(lambda x: x+1)
```
# Pandas内置的聚合方法
```
Pandas	方法 Numpy函数 说明
count 	np.count_nonzero 	频率统计(不包含NaN值)
size 	频率统计(包含NaN值)
mean np.mean 	求平均值
std np.std 	标准差
min np.min 	最小值
quantile() 	np.percentile() 	分位数
max np.max 	求最大值
sum np.sum 	求和
var np.var 	方差
describe 	计数、平均值、标准差，最小值、分位数、最大值
first 	返回第一行
last 	返回最后一行
nth 返回第N行(Python从0开始计数)
```
agg
agg.('列名':'方法名').rename('原名'：'新名')

# 转换
transform 转换，需要把DataFrame中的值传递给一个函数， 而后由该函数"转换"数据。
aggregate(聚合) 返回单个聚合值，但transform 不会减少数据量
```
# 计算z-score x - 平均值/标准差 
def my_zscore(x): 
	return (x-x.mean())/x.std()
 #按年分组 计算z-score 
df.groupby('year').lifeExp.transform(my_zscore)
```
# transform分组填充缺失值
```
之前介绍了填充缺失值的各种方法，对于某些数据集，可以使用列的平均值来填充缺失值。某些情况下，可以考虑将列进行分组，分
组之后取平均再填充缺失值
tips_10 = pd.read_csv('data/tips.csv').sample(10,random_state = 42) 
tips_10

```