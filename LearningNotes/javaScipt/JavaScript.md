8.1 
JS获取标签元素，操作标签属性（css属性,标签属性，内容）
alert() (执行相应的操作并且弹出对话框)

var定义的变量会向前申明（提前申明）

8.2
条件语句if


比较运算符
==	===	!=	>	<	>=	<=
注意：=== 判断值与类型
如果x=5   判断x===5为ture ，x==="5"为false


逻辑运算符:
&& and	||	or	!	not

8.3
获取标签元素
内置对象document的方法getElementByld

```
var oDiv=document.getElementById("div1")
alert(oDiv)
</script>
<div id="div1">this is div</div>
```

8.4
改属性
//js获取标签入口代码（必须写在匿名函数中  ）
html:class-->js:className   html:font-size--->js:对象.style.fontSize
```
window.onload(页面内容加载后立即执行此函数)=function（）
（没有函数名，只作用于这一次）{
	var oInput = document.getElementById("input1");
	var oA = document.getElementById("link01");
//获取标签
	alert(oInput.value);
	alert(oInput.name);
	alert(oA.className);
 //设置标签属性:对象名.属性名
//a的属性class ,通过对象访问时，使用名字className
oA.className = "sty02";（格式记住时对象.属性名=“新的css属性名"）
oA.style.fontSize = "50px";
}
```

8.5
读取或者改标签包裹的内容
对象.innerHTML
```
window.onload = function(){
	var oDiv = document.getElementById("div1");
	alert(oDiv.innnerHTML);
	oDiv.innerHTML  ="<ul></ul>"

}
```
8.6
数组创建：
实例化对象创建
```
var  alist = new Array(1,2,3); 
```
字面量方式创建
```
var alist2=[1,2,3,'abc'];
```
多维数组
```
var alist = [[1,2,3],['a','b']];
```
数组的操作
```
 var alist = [1,2,3,4];
alert(alist.length);

数组的尾部添加与尾部提取
var alist = [1,2,3,4];

//尾部添加一个5
alist.push(5)

//弹出1，2，3，4，5
alert(alist);

//尾部提取
alist.pop();

//弹出1，2，3，4
alert(alist);
```


根据下标添加和删除元素
arr.splice(start,num,element1,....,elementN)
参数解析
start ：必需，开始删除的索引
num：可选，删除数组元素的个数
elementN：可选，start索引位置要插入的新元素.
删除
```
var colors = ["red","green","blue"];
colors.splice(0,1)
alert(colors);//green,blue

添加
colors.splice(1,0,"yellow","orange");
alert(colors);//green,yellow,organge,blue

删除添加
colors.splice(1,1,"red","purple");
alert(colors)//green,red,purple,orange,blue
```


8.7
循环语句
for循环		while循环 	do-while循环
```
var array = [1,4,5];

for循环
for(var index = 0; index<array.length;index++){
	var result = array[index];
	alert(result);
}
```
```
while循环
var index = 0;
while(index<arrray.length){
	var result = array[index];
	console.log(访问内容。跟aler弹框不同，这是用来调试用的,看代码需要进入页面的Console页面)(alist[index]);
	index++;
}
```
```
do while循环

var index = 0;
do{
	var result = array[index];
	alert(result);
	index++;
}while(index<array.length);

```
8.8
字符串拼接"+"
```
 var i=100;
var i2=200;
var i3="123"

alert(i+i2);//300

alert(i2+i3);//200123
```
8.9
定时器
在一段特定的时间后执行某段代码
创建方式2种：
1.setTimeout(func[,delay,param1,param2,...]):以指定的时间间隔（以毫米计算）调用一次函数的定时器

2.settlnterval(func[,delay,param1,param2,...]):以指定的时间间隔（毫米）重复调用一个函数的计时器

```
<s>
	function hello(){
		alert('hello');
}
	setInterval(hell,1000);(每隔一秒调用函数一次，1000毫秒=1秒);
</s>
```
清除定时器2种

清除只执行一次的定时器
clearTimeout(timeoutID)

清除反复调用的定时器
clearInterval(timeoutID)
```
<s>
	function hello(){
		alert('hello');
		clearTimeout(t1)
}
	t1=setTimeout(hello,500)
</s>
```

8.10
链接
<script src ="js/jquery-1.12.4.min.js"></script>

$()是jQuery库中实现的函数，把你写的js对象（函数），转换成jQ自定义的对象
（jq函数里面做了window.onload的工作，页面加载完成事件）
优化：（使用jQ入口写法更快，比window.onload快）

写法：
```
$(function(){
	var	$div = $("#div1");
	alert("jquery:" +$div);
});
```


8.11
属性选择器
```
$("input[name=username]")
```

8.12
选择器转移
```
<script>
	$(function(){
	var $div =$('#div01')

	$('#div').prev();//表示选择的上一级
	//$div.prev().css({"color":"red"});($元素.关键字.css({"color":"red"}))
	$("#div").prevAll() ;//选择的元素上面的所有同级元素
	//$div.prevAll().css({"color":"blue"});
	$("#div").next() ;//下一个同级元素
	//$div.next().css({"color":"red"});
	$("#div").next()；//选择的元素下面的所有同级元素
	$("#div").parent();//表示选择的元素的父元素
	$("#div").children();//选择的元素的所有子元素
	$("#div").siblings();//选择的元素的其他同级元素
	$("#div").find('.myClass');//选择的id是box元素的class=myClass的元素
})
	
</script>


<div>
	<h2>这是第一个h2标签<h2>
	<p>这是第一个段落</p>
	<div id="div01">这是一个<span>div</span><span class="sp02">第二个span</span></div>
	<h2>这是第二个h2标签</h2>
	<p>这是第二个段落</p>
</div>

```

8.13
jq获取和设置标签内容
'''
<script>
	$(function(){
		var $div = $("#div1");
		//获取标签内容
		console.log($div.html())
		//设置标签内容：删除原理内容
		$div.html("hello world");
		
		//追加标签内容
		$div.append("hi")
	
})
</script>

<body>
	<div id="div1">
		<p>hello</p>
	</div>
</body>


8.14
prop获取属性值和设置属性值
与对象.css不同的是.css直接改css,prop直接改标签符的属性
prop 方法:
获取元素属性：对象.prop（“标签属性名”）
设置元素属性：对象.prop（“标签属性名”：“属性值”,...）

val方法：
获取元素属性：对象.val()
设置元素属性：对象.val("value值")


css方法：
获取样式属性:对象.css("样式属性名")
设置样式属性：对象.css({“样式属性名”：“属性值”})


8.15
常见事件：
click():点击事件
blur():失去焦点
focus():获取焦点
mouseover():鼠标进入
mouseout():鼠标离开
ready():页面加载完成

8.16
事件代理
原理：
利用底层原理（冒泡原理）：事件会向它的父级一层一层传递
把事件加到父级上，通过判断事件的来源，执行相应的子元素的操作

作用：
事件代理可以减少绑定，提高性能，让新子元素共享操作

```
$(cuntion(){
	$list = $('#list');
	$list.delegate('li','click',function(){
		$(this).css({background:'red'})
	})
})

<ul id="list">
	<li>1</li>
</ul>
```

8.17
json
json类似于js对象的字符串，是一种数据格式
json有两种格式1.对象格式 2.数组格式
json转换js对象：
```
var sjson = '{"name":"tom","age":10}';
var oPerson = JSON.parse(sjon);

alert(oPerson.name)
alert(operson.age)
```

8.18
ajax
前后台通讯获取数据的jQuery方法
特点：异步（多线程），局部刷新（优化）


```
<script>
	$(function(){
		$.get("http://t.weather.sojson.com/api/weather/city/101010100",
		function(data,status){
			console.log(data);
			console.log(status);
			alest(dat);
			}).error(function(){
				alert('网络异常');
			});
	});

	$.post("test.php",{"func":"getNameAndTime"},function(data){
		alert(data.name);
		console.log(data.time);
		
	},"json").error(function(){
		alert("网络异常");
	})
</script>

```

$.get和$.post方法的参数说明:

$.get(url,data,success(data, status, xhr),dataType).error(func)
$.post(url,data,success(data, status, xhr),dataType).error(func)

url 请求地址
data 设置发送给服务器的数据，没有参数不需要设置
success 设置请求成功后的回调函数
data 请求的结果数据
status 请求的状态信息, 比如: "success"
xhr 底层发送http请求XMLHttpRequest对象
dataType 设置返回的数据格式
"xml"
"html"
"text"
"json"
error 表示错误异常处理
func 错误异常回调函数


概括：
js获取标签与操作

window.onload = function(){...}
var oDiv =document.getElementbyId("div1");



****js调用js：
```
document.write("<script language=javascript src='/js/import.js'></script>");
document.write("<script language=jQuery src="js/jquery-1.12.4.min.js"></script>")
```


















	