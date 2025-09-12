# 逻辑运算
```
# 随机生成10名同学，5门功课的数据
score = np.random.randint(40, 100,(10,5))

print(score)

# 切片 取出最后4名同学的成绩，用逻辑判断
test_score = score[6:, 0:5]

# 逻辑判断
print(test_score > 60)

# 布尔索引(满足条件替换)
print(test_score[test_score > 60] =1)

判断or&and

# 判断前两名同学的成绩[0:2, :]是否全及格
>>> np.all(score[0:2, :] > 60)
False
np.any()
# 判断前两名同学的成绩[0:2, :]是否有大于90分的
>>> np.any(score[0:2, :] > 80)
True


```

# 三目运算
```
# 判断前四名学生,前四门课程中，成绩中大于60的置为1，否则为0
temp = score[:4, :4]
np.where(temp > 60, 1, 0)

# 判断前四名学生,前四门课程中，成绩中大于60且小于90的换为1，否则为0
np.where(np.logical_and(temp > 60, temp < 90), 1, 0)

# 判断前四名学生,前四门课程中，成绩中大于90或小于60的换为1，否则为0
np.where(np.logical_or(temp > 90, temp < 60), 1, 0)

```

数组运算时的广播机制：
# 数组在进行矢量化运算时，要求数组的形状是相等的。




