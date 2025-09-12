mean(平均值)
热数据
```
sns.heatmap(dataframe.corr(), annot=True, fmt='.1f')
```
(例子用于理解)
对比两个最小值的均值
（第一个age 提取出年龄）（[:2]（把排好序的的两个拿出））
```
np.mean([age for name ,age in sorted(person_and_age.items(), key = lambda e: e[1])[:2]])
```
对比两个最小值的均值
【:topn】(最前的两个数值)
history_price(数据)
e[0](取 面积：价格 的面积)
```
def find_price_by_similar(history_price,query_x, topn=3):
	most_similar_items = sorted(history_price.items(), key= lambda e: (e[0] - query_x)**2)[:topn]

	most_similar_prices = [price for rm, price in most_similar_items]
	average_prices = np.mean(most_similar_prices)
	return average_prices
```

回归预测结果产生的是一个数值，分类产生一个类别
KNN==>K-Neighbor-Nearest

拟合效果 是获取最优的k，b的问题


损失函数：
Loss
越接近0，越准确
```
𝑓(𝑟𝑚)=𝑘∗𝑟𝑚+𝑏
Random Approach
𝐿𝑜𝑠𝑠(𝑘,𝑏)=1𝑛∑𝑖∈𝑁(𝑦𝑖^−𝑦𝑖)2
 
𝐿𝑜𝑠𝑠(𝑘,𝑏)=1𝑛∑𝑖∈𝑁((𝑘∗𝑟𝑚𝑖+𝑏)−𝑦𝑖)2
```
 
怎么获取最优的k&b？
1.直接用微积分的方法做计算（最小二乘法）（简单才用，基本不用）
2.用随机模拟的方法来做（随机生成一堆数）也叫：蒙特卡洛模拟
```
def loss(y_hat, y):
    return np.mean((y_hat - y) ** 2)
import random


min_loss = float('inf')
best_k, bes_b = None, None

for step in range(1000):
    min_v, max_v = -100, 100
    k, b = random.randrange(min_v, max_v), random.randrange(min_v, max_v)
    y_hats = [k * rm_i  + b for rm_i in x]
    current_loss = loss(y_hats, y)
    
    if current_loss < min_loss:
        min_loss = current_loss
        best_k, best_b = k, b
        print('在第{}步，我们获得了函数 f(rm) = {} * rm + {}, 此时loss是: {}'.format(step, k, b, current_loss))

```
```
蒙特卡洛模拟
Supervisor
𝐿𝑜𝑠𝑠(𝑘,𝑏)=1/𝑛*∑𝑖∈𝑁((𝑘∗𝑟𝑚𝑖+𝑏)−𝑦𝑖)2
∂𝑙𝑜𝑠𝑠(𝑘,𝑏)/∂𝑘=2/𝑛*∑𝑖∈𝑁(𝑘∗𝑟𝑚𝑖+𝑏−𝑦𝑖)∗𝑟𝑚𝑖
∂𝑙𝑜𝑠𝑠(𝑘,𝑏)/∂𝑏=2/𝑛*∑𝑖∈𝑁(𝑘∗𝑟𝑚𝑖+𝑏−𝑦𝑖)
```
```
def partial_k(k, b, x, y):
    return 2 * np.mean((k * x + b - y) * x)

def partial_b(k, b, x, y):
    return 2 * np.mean(k * x + b - y)

k_history, b_history = [], []
loss_history = []
k, b = random.random(), random.random()
min_loss = float('inf')
best_k, bes_b = None, None
learning_rate = 1e-2

for step in range(2000):
    k, b = k + (-1 * partial_k(k, b, x, y) * learning_rate), b + (-1 * partial_b(k, b, x, y) * learning_rate)
    y_hats = k * x + b
    current_loss = loss(y_hats, y)
    
    if current_loss < min_loss:
        min_loss = current_loss
        best_k, best_b = k, b
        k_history.append(best_k)
        b_history.append(best_b)
        loss_history.append(current_loss)
        print('在第{}步，我们获得了函数 f(rm) = {} * rm + {}, 此时loss是: {}'.format(step, k, b, current_loss))
```

# 深度学习的核心 ： 通过梯度下降的方法，获得一组参数，是的loss最小
loss偏导式 + 梯度下降
![Snipaste_20210105_155120.png](0)


将课堂代码中的L2-Loss 变成L1Loss 并且实现梯度下降
```
𝐿2−𝐿𝑜𝑠𝑠(𝑦,𝑦̂ )=1/𝑛*∑(𝑦̂ −𝑦)2
 
𝐿1−𝐿𝑜𝑠𝑠(𝑦,𝑦̂ )=1/𝑛*∑|(𝑦̂ −𝑦)|
```
