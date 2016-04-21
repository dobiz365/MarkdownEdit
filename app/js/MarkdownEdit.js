/**
名称：markdown编辑器
功能：扩展textarea为一个全功能的markdown编辑器
作者：浙江省新昌县城西小学 唐明
email:14785198@qq.com

配置：
1.粘贴上传回调函数：uploadImageCallback(base64)，需要返回图片地址
2.无刷新上传：form名字markdown_upload,回调函数upload_image_success(ret)，
ret是一个JSON对象，{code:200,info:"",data:"图片地址"}
3.MarkdownEdit.preview编辑器模式，0=编辑  1＝预览 2＝对半
4.语法高亮函数回调：highLightSyntax，推荐使用Prism.highlightAll，在demo中有使用。
5.MarkdownEdit.breaks是否将换行转为<br/>，默认不转换


*/

var MarkdownEdit={
	preview:2,//0=编辑  1＝预览 2＝对半
	breaks:false,//默认换行不转为<br/> 需要两个空格加回车
	highLightSyntax:null,//默认的语法高亮函数
	uploadImageCallback:null,//默认的上传图片的callback(base64格式)
	uploadImageDialog:null,//用于对话框上传
	saveFileCallback:null,//保存文件回调
	openFileCallback:null,//打开文件回调
	newFileCallback:null,//新文件回调
	saveAsCallback:null,//另存为回调
	editChange:null,//编辑器改变时回调
	current_edit:null,//当前编辑框
	create:function(){
		//查找类名为markdown的所有textarea元素	
		var ele=this.getClass('markdown','textarea');
		if(ele.length<=0) return;//如果没有找到编辑器，则返回
		this.edits=ele;//保存编辑器变量
		
		var li=['fa fa-folder-open','fa fa-file','fa fa-save','fa fa-copy','','fa fa-bold','fa fa-italic','','fa fa-link','fa fa-quote-left',
		'fa fa-image','fa fa-list-ul','fa fa-list-ol',
		'fa fa-minus','','fa fa-edit','fa fa-columns',
		'fa fa-eye','','fa fa-question-circle'];
		var title=['打开','新文件','保存','另存为','','加粗','斜体','','超级链接','引用',
		'图片','无序列表','有序列表',
		'分隔线','','编辑视图','分割视图',
		'预览视图','','帮助'];
		//包含toolbar和preview		
		for(var i=0;i<ele.length;i++){
			MarkdownEdit.current_edit=ele[i];
			ele[i].onkeyup=this.keyup;
			ele[i].spellcheck=false;
			ele[i].onscroll=this.edit_scroll;
			var textsize=this.get_element_size(ele[i]);
			this.bind_paste(ele[i]);
			var parent=ele[i].parentNode;
			var after=ele[i].nextSibling;//下一个元素
			var wrap=document.createElement('div');
			wrap.style.padding='0px';
			wrap.edit_obj=ele[i];
			
			var toolbar=this.create_toolbar(li,title);//创建工具栏			
			var box=document.createElement('div');//创建textarea和preview的包裹div
			box.className='markdown_edit_preview';
			box.style.height=textsize.height+'px';
			var preview=document.createElement('div');//preview对象
			preview.className='markdown_preview';						
			preview.style.position='absolute';
			preview.style.overflowY='scroll';
			preview.style.height=textsize.height+'px';
			box.appendChild(ele[i]);
			box.appendChild(preview);	
			
			wrap.style.overflow='hidden';
			wrap.appendChild(toolbar);
			wrap.appendChild(box);
			
			wrap.preview_obj=preview;
			
			if(parent){
				parent.insertBefore(wrap,after);
				this.reflush(wrap);
			}
			this.set_preview(ele[i],preview);
		}
		//监听事件
		
	},
	edit_scroll:function(evt){
		evt = window.event || evt;
		var element=evt.target || evt.srcElement;
		var parent=element.parentNode.parentNode;
		var preview=parent.preview_obj;		
		var scroll=0;
		var size=MarkdownEdit.get_element_size(element);
		scroll=(element.scrollTop)/(element.scrollHeight-size.height);
		if(scroll!=element.old_scrool){
			element.old_scrool=scroll;
			preview.scrollTop=(preview.scrollHeight-size.height)*scroll;
		}
	},
	//
	keyup:function(evt){
		evt = window.event || evt;
		var element=evt.target || evt.srcElement;
		var parent=element.parentNode.parentNode;
		console.log(evt);
		if(evt.altKey || evt.ctrlKey || evt.keyCode<20) return;
		if(MarkdownEdit.preview>0){
			MarkdownEdit.reflush(parent);
			if(MarkdownEdit.highLightSyntax){
				MarkdownEdit.highLightSyntax();
			}
		}
		if(MarkdownEdit.editChange){
			MarkdownEdit.editChange(evt);
		}
	},
	setEdit:function(value){//设置textarea的值
		MarkdownEdit.current_edit.value=value;
		var html=MarkdownEdit.parse(value);
		var parent=MarkdownEdit.current_edit.parentNode.parentNode;
		parent.preview_obj.innerHTML=MarkdownEdit.parse(value);
		if(MarkdownEdit.highLightSyntax){
				MarkdownEdit.highLightSyntax();
		}
	},
	getText:function(){
		return MarkdownEdit.current_edit.value;
	},
	addImage:function (url){
		var edit=MarkdownEdit.current_edit;
		MarkdownEdit.insertHtml(edit,'![]('+url+')');
		MarkdownEdit.reflush(MarkdownEdit.current_edit.parentNode.parentNode);
	},
	reflush:function(parent){
		var text=parent.edit_obj.value;
		var html=MarkdownEdit.parse(text);
		parent.preview_obj.innerHTML=html;
		
	},
	repaint:function(){
		var edit=MarkdownEdit.current_edit;
		var parent=MarkdownEdit.current_edit.parentNode.parentNode;
		MarkdownEdit.reflush(parent);
		MarkdownEdit.set_preview(edit,parent.preview_obj)
	},
	//设置预览
	set_preview:function(edit,preview){
		switch(this.preview){
			case 0://编辑
				edit.style.left='0px';
				edit.style.visibility='visible';
				edit.style.width='100%';
				preview.style.width='100%';
				preview.style.visibility='hidden';
				preview.style.borderLeft='1px solid #444';
				break;
			case 1://预览
				preview.style.left='0px';
				preview.style.borderLeft='1px solid #444';
				preview.style.visibility='visible';
				edit.style.width='100%';
				preview.style.width='100%';
				edit.style.width='0px';
				edit.style.visibility='hidden';
				break;
			case 2://对半
				preview.style.left='50%';
				preview.style.borderLeft='none';
				preview.style.visibility='visible';
				preview.style.width='50%';
				edit.style.width='50%';
				edit.style.visibility='visible';
				break;
		}
	},
	create_toolbar:function(li,title){
		//生成toolbar
		var toolbar=document.createElement('div');
		toolbar.className='markdownedit_toolbar';
		var ul=document.createElement('ul');
		for(var i=0;i<li.length;i++){
			var objli=document.createElement('li');
			var span=document.createElement('span');
			if(li[i]==''){
				span.innerText='|';
			}else{
				span.className=li[i];
				span.title=title[i];				
				span.onclick=this.toolbar_click;
			}			
			objli.appendChild(span);
			ul.appendChild(objli);
		}
		toolbar.appendChild(ul);
		return toolbar;
	},
	
	toolbar_click:function(evt){
		evt = window.event || evt;
		var element=evt.target || evt.srcElement;
		var classname=element.className.split(' ');
		var parent=element.parentNode.parentNode.parentNode.parentNode;
		
		var edit=parent.edit_obj;
		//console.log(edit);
		if(classname.length==2){
			switch(classname[1]){
				case 'fa-folder-open'://打开文件
					if(MarkdownEdit.openFileCallback){
						MarkdownEdit.openFileCallback();
					}
					break;
				case 'fa-file'://新文件
					if(MarkdownEdit.newFileCallback){
						MarkdownEdit.newFileCallback();
					}
					break;
				case 'fa-save'://保存文件
					if(MarkdownEdit.saveFileCallback){
						MarkdownEdit.saveFileCallback();
					}
					break;
				case 'fa-copy'://另存为
					if(MarkdownEdit.saveAsCallback){
						MarkdownEdit.saveAsCallback();
					}
					break;
				case 'fa-bold':
					MarkdownEdit.packageHtml(edit,'**','**');
					MarkdownEdit.reflush(parent);
					break;
				case 'fa-italic':
					MarkdownEdit.packageHtml(edit,'*','*');
					MarkdownEdit.reflush(parent);
					break;
				case 'fa-link':
					MarkdownEdit.show_link_dialog(edit);
					break;
				case 'fa-quote-left':
					MarkdownEdit.insertHtml(edit,'\n> 引用的内容\n');
					MarkdownEdit.reflush(parent);
					break;
				case 'fa-image':
					MarkdownEdit.show_image_dialog();
					break;
				case 'fa-list-ul':
					MarkdownEdit.insertHtml(edit,'\n- 这是无序列表\n');
					MarkdownEdit.reflush(parent);
					break;
				case 'fa-list-ol':
					MarkdownEdit.insertHtml(edit,'\n1. 这是有序列表\n');
					MarkdownEdit.reflush(parent);
					break;
				case 'fa-minus':
					MarkdownEdit.insertHtml(edit,'\n-----\n');
					MarkdownEdit.reflush(parent);
					break;
				case 'fa-edit':
					MarkdownEdit.preview=0;
					MarkdownEdit.set_preview(edit,parent.preview_obj);					
					break;
				case 'fa-columns':
					MarkdownEdit.preview=2;
					MarkdownEdit.set_preview(edit,parent.preview_obj);
					break;
				case 'fa-eye':
					MarkdownEdit.preview=1;
					MarkdownEdit.set_preview(edit,parent.preview_obj);
					break;
				case 'fa-eye':
				
					break;
				case 'fa-question-circle':
					MarkdownEdit.show_question_dialog();
					break;
			}
		}
	},
	//绑定编辑器的粘贴事件
	bind_paste:function(edit){
		//console.log('bind');
		edit.onpaste=function(e){		
			//console.log('copy image');
			var clipboardData = e.clipboardData,
			i = 0,
			items, item, types;

			if( clipboardData ){
				items = clipboardData.items;

				if( !items ){
					return;
			   }

				item = items[0];
				types = clipboardData.types || [];

				for( ; i < types.length; i++ ){
					if( types[i] === 'Files' ){
						item = items[i];
						break;
					}
				}

				if( item && item.kind === 'file' && item.type.match(/^image\//i) ){
					imgReader( item);
				}
			}
		};
		
		var imgReader = function( item ){
			var blob = item.getAsFile(),
				reader = new FileReader();

			reader.onload = function( e ){			
				var s=e.target.result;
				if(MarkdownEdit.uploadImageCallback){
					MarkdownEdit.current_edit=edit;
					MarkdownEdit.uploadImageCallback(s);
				}
			};
			reader.readAsDataURL( blob );
		}; 
	},
	show_question_dialog:function(){
		var mask=document.createElement('div');
		mask.className='markdown_dialog_mask';
		mask.style.width=document.body.scrollWidth+'px';
		mask.style.height=document.body.scrollHeight+'px';
		mask.id='markdown_dialog_mask_374';
		var dialog=document.createElement('div');		
		dialog.className='markdown_dialog';
		dialog.id='markdown_dialog_374';
		dialog.style.height='300px';
		var t1=document.createElement('h3');
		t1.innerText='软件介绍';
		var t2=document.createElement('div');
		t2.style.lineHeight=2;
		t2.innerHTML='作者：浙江省新昌县城西小学 唐明<br/>网址：<a href="www.xzpad.com">www.xzpad.com</a><br/>功能：Markdown编辑器<br/>'+
		'主要语法：# 标题 > 引用 ** 加粗 * 斜体 ```代码 []() 链接 ![]() 图像 +或- 无序列表 1. 有序列表';
		var t3=document.createElement('div');
		var b2=document.createElement('button');
		b2.innerText='确定';
		b2.onclick=function(evt){
			document.body.removeChild(mask);
			document.body.removeChild(dialog);
		};
		b2.className='ok';
		t3.appendChild(b2);
		dialog.appendChild(t1);
		dialog.appendChild(t2);
		dialog.appendChild(t3);
		document.body.appendChild(mask);
		document.body.appendChild(dialog);
		var size=MarkdownEdit.get_element_size(dialog);
		var winWidth=1000;
		var winHeight=800;
		if (window.innerWidth) winWidth = window.innerWidth;
			else if ((document.body) && (document.body.clientWidth))
				winWidth = document.body.clientWidth;
		// 获取窗口高度
		if (window.innerHeight)winHeight = window.innerHeight;
			else if ((document.body) && (document.body.clientHeight))
				winHeight = document.body.clientHeight;
		dialog.style.top=(winHeight-size.height)/2+'px';
		dialog.style.left=(winWidth-size.width)/2+'px';
	},
	//显示插入链接的对话框
	show_link_dialog:function(edit){
		var mask=document.createElement('div');
		mask.className='markdown_dialog_mask';
		mask.style.width=document.body.scrollWidth+'px';
		mask.style.height=document.body.scrollHeight+'px';
		mask.id='markdown_dialog_mask_374';
		var dialog=document.createElement('div');		
		dialog.className='markdown_dialog';
		dialog.id='markdown_dialog_374';
		var t1=document.createElement('h3');
		t1.innerText='插入链接';
		var t2=document.createElement('div');
		t2.innerText='请在下方的输入框内输入要插入的链接地址';
		var t3=document.createElement('div');
		var input=document.createElement('input');
		input.setAttribute('type','text');
		input.id='markdown_input_374';
		input.value='http://';
		var b1=document.createElement('button');
		b1.innerText='取消';
		b1.onclick=function(){
			document.body.removeChild(mask);
			document.body.removeChild(dialog);
		}
		b1.className='cancel';
		var b2=document.createElement('button');
		b2.innerText='确定';
		b2.edit_obj=edit;
		b2.onclick=function(evt){
			evt = window.event || evt;
			var element=evt.target || evt.srcElement;
			var e=element.edit_obj;
			var url=input.value.trim();
			document.body.removeChild(mask);
			document.body.removeChild(dialog);
			if(url!='' && url!='http://'){
				MarkdownEdit.insertHtml(e,'['+url+']('+url+')');
				MarkdownEdit.reflush(e.parentNode.parentNode);
			}
		};
		b2.className='ok';
		t3.appendChild(input);
		t3.appendChild(b1);
		t3.appendChild(b2);
		dialog.appendChild(t1);
		dialog.appendChild(t2);
		dialog.appendChild(t3);
		document.body.appendChild(mask);
		document.body.appendChild(dialog);
		var size=MarkdownEdit.get_element_size(dialog);
		var winWidth=1000;
		var winHeight=800;
		if (window.innerWidth) winWidth = window.innerWidth;
			else if ((document.body) && (document.body.clientWidth))
				winWidth = document.body.clientWidth;
		// 获取窗口高度
		if (window.innerHeight)winHeight = window.innerHeight;
			else if ((document.body) && (document.body.clientHeight))
				winHeight = document.body.clientHeight;
		dialog.style.top=(winHeight-size.height)/2+'px';
		dialog.style.left=(winWidth-size.width)/2+'px';
	},
	
	//显示上传图片的对话框
	show_image_dialog:function(edit){
		if(this.uploadImageDialog){
			this.uploadImageDialog();
		}
	},
	//取元素大小
	get_element_size:function(elem){
		var w,h;
		if(elem.style.display=='none'){
			var v=elem.style.visibility;
			elem.style.visibility='hidden';
			var p=elem.style.position;
			elem.style.position='absolute';
			elem.style.display='block';
			w=elem.clientWidth || getStyle(elem,'width');
			h=elem.clientHeight || getStyle(elem,'height');
			return {width:w,height:h};			
			elem.style.display='none';
			elem.style.position=p;
			elem.style.visibility=v;			
		}else{		
			w=elem.offsetWidth || getStyle(elem,'width');
			h=elem.offsetHeight || getStyle(elem,'height');
			
		}
		return {width:parseInt(w),height:parseInt(h)};
	},
	/**
	用指定元素包裹元素
	*/
	wrap:function(ele,wrap_ele){
		if(typeof(wrap_ele)=='string'){//需要创建元素
			wrap_ele=document.createElement(wrap_ele);
		}
		var after=ele.nextSibling;//下一个元素
		var parent=ele.parentNode;
		if(parent){
			parent.removeChild(ele);
			wrap_ele.appendChild(ele);
			parent.insertBefore(wrap_ele,after);
			return wrap_ele;//返回包裹元素
		}else{
			return null;
		}
	},
	/**
	功能：根据指定类名和标签名查找元素
	参数：className需要查找的类名   tagName 查找的标签名（可显著缩短查找时间）
	返回值：数组
	*/
	getClass:function(className,tagName) //类名className的元素
	{
		if(arguments.length<1) return [];
		if(arguments.length<2) tagName='*';
		
		if(document.getElementsByClassName){ //支持这个函数
			return document.getElementsByClassName(className);
		}
		else
		{       var tags=document.getElementsByTagName(tagName);//获取标签
			var tagArr=[];//用于返回类名为className的元素
			for(var i=0;i < tags.length; i++)
			{
				var arr=tags[i].class.split(' ');//在多个类名中查找
				for(var j=0;j<arr.length;j++){
					if(arr[j]==className){
						tagArr.push(tags[i]);
					}
				}			
			}
			return tagArr;
		}
	},

	/**
	在textarea中当前光标位置包裹文本的函数
	*/
	packageHtml:function(edit, before,after) {
		if(typeof(edit)=='string') edit=document.getElementById(edit);
		if (document.selection) {//IE support
			edit.focus();
			sel = document.selection.createRange();
			sel.text = before+sel.text+after;
			sel.select();
		}else if (edit.selectionStart || edit.selectionStart == '0') {//MOZILLA/NETSCAPE support 
			var startPos = edit.selectionStart;
			var endPos = edit.selectionEnd;
			var restoreTop = edit.scrollTop;
			edit.value = edit.value.substring(0, startPos) + before+edit.value.substring(startPos,endPos)+after + edit.value.substring(endPos, edit.value.length);
			edit.focus();
			edit.selectionStart = startPos ;
			edit.selectionEnd = startPos;
			edit.scrollTop = restoreTop;		
		} else {
			edit.value += before+' '+after;
			edit.focus();
		}
	},

	/**
	在textarea中当前光标位置插入文本的函数
	*/
	insertHtml:function(edit, html) {
		if(typeof(edit)=='string') edit=document.getElementById(edit);
		if (document.selection) {//IE support
			edit.focus();
			sel = document.selection.createRange();
			sel.text = html;
			sel.select();
		}else if (edit.selectionStart || edit.selectionStart == '0') {//MOZILLA/NETSCAPE support 
			var startPos = edit.selectionStart;
			var endPos = edit.selectionEnd;
			var restoreTop = edit.scrollTop;
			edit.value = edit.value.substring(0, startPos) + html + edit.value.substring(endPos, edit.value.length);
			edit.scrollTop = restoreTop;
			edit.selectionStart = startPos + html.length;
			edit.selectionEnd = startPos + html.length;
			edit.focus();
		} else {
			edit.value += html;
			edit.focus();
		}
	},

	parse:function(src){
		var dest=[];
		
		var language='js';
		var i=0;
		var ele=[];
		//取得参考链接
		var ref={};
		var reg=/\[(.*?)\]: (.*?)\n/gi;
		var ref_arr;
		while(ref_arr=reg.exec(src)){
			for(var j=0;j<src.length;j++){
				ref[ref_arr[1]]=ref_arr[2];
			}
		}
		for(var r in ref){
			src=src.replace('['+r+']','['+ref[r].trim()+']');				
		}
		src=src.replace(reg,'');
		
		reg=/!\[(.*?)\]\[(.*?)\]/gi;
		src=src.replace(reg,'<img src="$2" alt="$1"/>');
		reg=/\[(.*?)\]\[(.*?)\]/gi;
		src=src.replace(reg,'<a href="$2">$1</a>');
		
		var arr=src.split("\n");
		
		while(i<arr.length){
			var s=arr[i];
			var temp=s.split(' ');
			var ltype=this.getcmd(s);
			if(ltype=='h1' || ltype=='h2' || ltype=='h3' || ltype=='h4' || ltype=='h5' || ltype=='h6'){//一级标题
				temp.shift();
				if(temp.length>0){
					var temp_s=this.parse_inline(temp.join(' ').replace(/\</g,'&lt;'));
					dest.push('<'+ltype+'>'+temp_s+'</'+ltype+'>\n');
				}
			}else if(ltype=='quote'){//引用
				
				var dddd=[];
				do{
					temp.shift();
					if(temp.length>0){
						var temp_s=this.parse_inline(temp.join(' ').replace(/\</g,'&lt;'));
						dddd.push(temp_s+'<br/>');
					}
					i++;
					if(i>=arr.length) break;
					s=arr[i];
					temp=s.split(' ');
					ltype=this.getcmd(s);
				}while(ltype=="quote");				
				dest.push('<div class="markdown_preview_quote_div"><p>'+dddd.join("\n")+'</p></div>\n');
				i--;
			}else if(ltype=='ol'){//有序列表
				var t=[];
				t.push('<ol>');
				do{				
					temp.shift();
					if(temp.length>0){
						t.push('<li>'+this.parse_inline(temp.join(' ').replace(/\</g,'&lt;'))+'</li>');
					}
					i++;
					if(i>=arr.length) break;
					s=arr[i];
					temp=s.split(' ');
					ltype=this.getcmd(s);
				}while(ltype=='ol');
				t.push('</ol>');
				dest.push(t.join("\n")+"\n");
				i--;
			}else if(ltype=='ul'){//无序列表
				var t=[];
				t.push('<ul>');
				do{
					temp.shift();
					if(temp.length>0){
						t.push('<li>'+this.parse_inline(temp.join(' ').replace(/\</g,'&lt;'))+'</li>');
					}
					i++;
					if(i>=arr.length) break;
					s=arr[i];
					temp=s.split(' ');
					ltype=this.getcmd(s);
				}while(ltype=='ul');
				t.push('</ul>');
				dest.push(t.join("\n")+"\n");
				i--;
			}else if(ltype=='program1'){
				var t=[];
				var tou='<pre class="line-numbers"><code class="language-js">';
				do{
					t.push(s.substring(4));
					i++;
					if(i>=arr.length) break;
					s=arr[i];
					temp=s.split(' ');
					ltype=this.getcmd(s);
				}while(ltype=='program1');
				wei='</code></pre>\n';
				dest.push(tou+t.join("\n").replace(/\</g,'&lt;')+wei);
				i--;
			}else if(ltype=='program'){//代码高亮
				language=s.substr(3,400).trim();
				var lan=['php','js','cpp','java','css','html','python'];
				var ii=-1;
				for(var ti=0;ti<lan.length;ti++){
					if(lan[ti]==language){
						ii=ti;
						break;
					}
				}
				if(ii==-1) language='js';
				dest.push('<pre class="line-numbers"><code class="language-'+language+'">');
				i++;
				while(i<arr.length){
					var ss=arr[i].split(' ');
					ltype=this.getcmd(arr[i]);
					if(ltype=='program'){
						break;
					}else{
						var dm=arr[i].replace(/\</g,'&lt;');
						dest.push(dm+"\n");
						i++;
					}
				}
				dest.push('</code></pre>\n');
				
			}else if(ltype=='table'){
				var t=[];
				t.push('<table cellspacing="0" cellpadding="0">');
				var th=s.split('|');
				t.push('<tr>');
				for(var j=0;j<th.length;j++) if(th[j].trim()!='') t.push('<th>'+th[j].replace(/\</g,'&lt;')+'</th>');
				t.push('</tr>');
				i++;
				if(i>=arr.length) s='';
					else s=arr[i];
				temp=s.split(' ');
				ltype=this.getcmd(s);
				while(ltype=='table'){
					t.push('<tr>');
					var td=s.split('|');
					for(var m=0;m<td.length;m++) if(td[m].trim()!='') t.push('<td>'+td[m].replace(/\</g,'&lt;')+'</td>');				
					t.push('</tr>');
					i++;
					if(i>=arr.length) break;
					s=arr[i];
					temp=s.split(' ');
					ltype=this.getcmd(s);
				}
				t.push('</table>');
				dest.push(t.join("\n"));
				i--;
			}else if(ltype=='hr'){
				dest.push('<hr>');
			}else{
				if(s.trim()==''){
					if(this.breaks){//换行转为<br/>
						dest.push('<br/>');
					}else{
						if(s.substring(0,2)=='  '){//必须两个空格加换行转为<br/>
							dest.push('<br/>');
						}
					}
				}else{
					dest.push('<p>'+this.parse_inline(s)+'</p>\n');
				}
			}
			i++;
		}
		
		return dest.join("");
	},

	/**
	功能：根据输入字符串确定命令类型
	参数：t		输入字符串
	返回：命令
	h1 h2 h3 h4 h5 h6		标题
	quote					引用
	program					代码
	p						文本
	hr						分隔线
	ul						无序列表
	ol						有序列表
	*/
	getcmd:function(s){
		temp=s.split(' ');
		t=temp[0];
		if(t=='#') {
			return 'h1';
		}else if(t=='##') {
			return 'h2';
		}else if(t=='###') {
			return 'h3';
		}else if(t=='####') {
			return 'h4';
		}else if(t=='#####') {
			return 'h5';
		}else if(t=='######') {
			return 'h6';
		}else if(t=='>') {
			return 'quote';
		}else if(t=='-' || t=='+') {
			return 'ul';
		}else if(t=='|'){
			return 'table';
		}
		if(s.substring(0,4)=='    '){
			return 'program1';
		}
		var reg=/^[```]{3}/;
		if(reg.test(t)){
			return 'program';
		}
		var reg=/^[\d]+?\. /;
		if(reg.test(t)){
			return 'ol';
		}
		reg=/^[\-]{3,}/;
		if(reg.test(t)){
			return 'hr';
		}
		return 'p';
	},
	/**
	功能：解释行内命令
	参数：src 输入的marktx字符
	返回：解释后的HTML字符
	行内命令有：图片 ![]()，加粗 ** **    倾斜* * 链接[]()  行内代码` `
	*/
	parse_inline:function(src){
		var reg=/!\[(.*?)\]\((.*?)\)/gi;
		src=src.replace(reg,'<img src="$2" alt="$1"/>');
		reg=/\[(.*?)\]\((.*?)\)/gi;
		src=src.replace(reg,'<a href="$2" target="_blank">$1</a>');
		reg=/\*\*(.*?)\*\*/gi;
		src=src.replace(reg,'<b>$1</b>');
		reg=/\*(.*?)\*/gi;
		src=src.replace(reg,'<i>$1</i>');
		reg=/`(.*?)`/gi;
		src=src.replace(reg,'<code>$1</code>');
		return src;
	}
	
}

MarkdownEdit.create();