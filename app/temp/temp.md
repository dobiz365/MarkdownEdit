## nw.js做的特别的markdown编辑器

网上有很多markdown编辑器，有些也是很不错的，比如神器sublime text，比如windows下地MarkdownPad等等，但对于程序员来说，这些可能并不一定适合我们，我们可能需要一些自己特殊的功能，比如我需要一个可以轻松粘贴图片的功能，这个功能在上述编辑器中都没有实现，比如我需要实时对Markdown文本进行预览，sublime text要实现这个功能挺麻烦的。所以就产生了这个项目。
  
#### 好用的功能点：
1.直接在编辑框中复制粘贴图片
2.定时保存文件，防止文章丢失
3.实时对markdown文档进行渲染，显示效果出色
4.可以完全对它进行您自己的定制（比如，把图片上传到云上，直接把文章上传到你的博客等等）
  
本项目使用nw.js制作，在使用前您需要先下载nw.js。下载地址：[http://nwjs.io/](http://nwjs.io/)，如果你想对编辑器进行自己的开发，那么就下载一个SDK版，如果觉得已经很好用了，就下载一个normal版。
  
#### 下面是使用编辑器的步骤：
1.下载nw.js包（上面已有说明），并解压到你喜欢的目录。（注意你的系统版本，下载对应的版本）
2.下载我的markdown编辑器，把package.json复制到你的nw.js目录下。如下图所示
![](/app/temp/1461197970224.png)
3.把app目录也复制到nw.js目录下。和package.json同级。
4.双击nw.exe即可运行（您可以把nw.exe改成你喜欢的名字）

#### 修改的方法
编辑器脚本都在app目录下，入口文件是index.html，主js文件是js/main.js。编辑器控件是js/MarkdownEdit.js，语法高亮插件是Prism.js。对于nw.js的具体API，请自行参考nwjs.io的API文档。

本项目作者：米斯唐（http://www.misitang.com）
2016-4-21





