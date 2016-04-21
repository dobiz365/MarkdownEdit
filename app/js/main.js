var title='MarkdownEdit V1.0',copy_right='by misitang';
var fs=require("fs");
var path = require('path');
var win=null;
var auto_save_time=5*60*1000;//默认5分钟
var info={
	modifyed:false,
	filename:'',
	path:'',
};

MarkdownEdit.highLightSyntax=Prism.highlightAll;

MarkdownEdit.uploadImageCallback=function(base64){//复制粘贴上传
	//检查
	var arr=base64.split(',');
	if(arr.length>0){
		var bitmap = new Buffer(arr[1], 'base64');
		var a=arr[0].split(';');
		var ext='.png';
		if(a.length>0) {
			var b=a[0].split('/');
			if(b.length>0) {
				ext='.'+b[1];
			}
		}
		var timestamp=new Date().getTime();
		var file='/app/temp/'+timestamp+ext;
		fs.writeFileSync('.'+file, bitmap);
		MarkdownEdit.addImage(file);
	}
};

MarkdownEdit.uploadImageDialog=function(){
	//上传图片
	openChooseFile("#openImgDialog", function(filename){
		var src=fs.readFileSync(filename);
		var ext=path.extname(filename);
		var timestamp=new Date().getTime();
		fs.writeFileSync('./app/temp/'+timestamp+ext, src);
		MarkdownEdit.addImage('/app/temp/'+timestamp+ext);
	});
};

MarkdownEdit.saveFileCallback=function(){
	//保存文件
	if (info.filename!='' && info.filename!='./app/temp/temp.md') {
		var text = MarkdownEdit.getText();
		text=copyImage_src(info.path+'/',text);
		fs.writeFile(info.filename, text, function(err) {
			if(err) {
				console.log(err);
			} else {
				info.modifyed=false;					
				win.title=title+' '+info.filename + " --- "+copy_right; 
			}
		}); 
	}else  save();
	
};
//编辑器改变
MarkdownEdit.editChange=function(){
	info.modifyed=true;
	win.title=win.title=title+' '+info.filename + " 未保存 --- "+copy_right; 
};

MarkdownEdit.saveAsCallback=function(){
	//另存为
	save();
}

MarkdownEdit.openFileCallback=function(){
	//打开文件
	openFile();
};
MarkdownEdit.newFileCallback=function(){
	checkSaved(function() {
		MarkdownEdit.setEdit('');
	});
};

function save(callback) {
	openChooseFile("#saveFileDialog", function(filename){
		var text = MarkdownEdit.getText();
		text=copyImage_src(path.dirname(filename)+'/',text);
		fs.writeFileSync(filename, text);
		info.filename=filename;
		info.modifyed=false;					
		info.path = path.dirname(filename);
		win.title=title+' '+filename + " --- "+copy_right;
		if(callback) callback();
	});
}

function openFile() {
	checkSaved(function() {
		openChooseFile("#openFileDialog", function(filename){			
			loadFile(filename);		
		});
	});
}

function loadFile(filename){
	var data=fs.readFileSync(filename);
	
	//复制图片到本地目录
	data=copyImage_temp(path.dirname(filename)+'/',data.toString());
	MarkdownEdit.setEdit(data);
	info.modifyed=false;
	info.filename = filename;
	info.path = path.dirname(filename);
	
	win.title=title+' '+filename + " --- "+copy_right;	
}

function openChooseFile(name, callback) {
	var chooser = $(name);
	chooser.change(function(evt) {
		callback($(this).val());
		// this.value = null;
	});
	chooser.click(function() {
		// console.log("asd");
		// callback(global.$(this).val());
		this.value = null;
	});

	chooser.trigger('click');
};

function copyImage_src(dir,text){
	//找到所有图片
	var image={};
	//两种形式 ![]() 和[]: ()
	var reg1=/\[(.*?)\]: (.*?)\n/gi;
	var ref_arr;
	while(ref_arr=reg1.exec(text)){
		image[ref_arr[2]]=true;
	}
	var reg2=/!\[(.*?)\]\((.*?)\)/gi;
	while(ref_arr=reg2.exec(text)){
		image[ref_arr[2]]=true;
	}
	var src,dst,fname;
	
	for(url in image){
		if((url.substring(0,7)).toUpperCase()!='HTTP://'){
			
			fname=path.basename(url);			
			src=fs.readFileSync('.'+url);
			dst=dir+fname;
			fs.writeFileSync(dst,src);
			//替换图片地址
			var re=new RegExp(url,"g");
			text=text.replace(re,fname);
		}
	}
	return text;
}

function copyImage_temp(dir,text){
	//找到所有图片
	var image={};
	//两种形式 ![]() 和[]: ()
	var reg1=/\[(.*?)\]: (.*?)\n/gi;
	var ref_arr;
	while(ref_arr=reg1.exec(text)){
		image[ref_arr[2]]=true;
	}
	var reg2=/!\[(.*?)\]\((.*?)\)/gi;
	while(ref_arr=reg2.exec(text)){
		image[ref_arr[2]]=true;
	}
	var src,dst,fname;
	
	for(url in image){
		if((url.substring(0,7)).toUpperCase()!='HTTP://'){
			fname=path.basename(url);		
			src=fs.readFileSync(dir+url);

			dst="/app/temp/"+fname;
			fs.writeFileSync('.'+dst,src);
			//替换图片地址
			var re=new RegExp(url,"g");
			
			text=text.replace(re,dst);
		}
	}
	return text;
}

function checkSaved(callback){
	if(info.modifyed){//未保存
		var f=confirm('您的文件还未保存，现在需要保存吗？');
		if(f){
			if (info.filename!='') {
				var text = MarkdownEdit.getText();
				text=copyImage_src(info.path+'/',text);
				fs.writeFileSync(info.filename, text);
				info.modifyed=false;					
				win.title=title+' '+info.filename + " --- "+copy_right; 
			}else {
				save(function(){
					if(callback) callback();
				});
				return;
			}
		}
	} 
	if(callback) callback();
	
}

function init(){
	document.getElementById("edit").focus();
	//开始时加载窗口位置和大小

	//设置窗口位置和大小
	 
	//加载事件
	win = nw.Window.get();

	win.on("resize",resize);
	win.on("closed",close_handler);
	win.on('close',function(){
		checkSaved(function(){
			var text=MarkdownEdit.getText();
			fs.writeFileSync("./info.json",JSON.stringify(info));
			fs.writeFileSync("./app/temp/temp.md",text);
			win.close(true);
		});
		return true;
	});
	$(document).on('keydown',function(evt){
		if(evt.ctrlKey){
			if(evt.keyCode==83){//保存  ctrl+s
				MarkdownEdit.saveFileCallback();
			}else if(evt.keyCode==79){//打开  ctrl+o
				MarkdownEdit.openFileCallback();
			}else if(evt.keyCode==78){//新建  ctrl+n
				MarkdownEdit.newFileCallback();
			}else if(evt.keyCode==73){//插入图片  ctrl+i
				MarkdownEdit.uploadImageDialog();
			}else if(evt.keyCode==49 || evt.keyCode==97){//编辑视图  ctrl+1
				console.log('ctrl+1');
				MarkdownEdit.preview=0;
				MarkdownEdit.repaint();
			}else if(evt.keyCode==50 || evt.keyCode==98){//对分视图  ctrl+2
			
				MarkdownEdit.preview=2;
				MarkdownEdit.repaint();
			}else if(evt.keyCode==51 || evt.keyCode==99){//预览视图  ctrl+3
				MarkdownEdit.preview=1;
				MarkdownEdit.repaint();
			}
		}
	});
	win.maximize();
	load_info();
	resize(info.width,info.height);
	setInterval(auto_save,auto_save_time);//自动保存
}


$(function(){
	init();		
});


//定时保存
function auto_save(){
	var text=MarkdownEdit.getText();
	fs.writeFileSync("./info.json",JSON.stringify(info));
	fs.writeFileSync("./app/temp/temp.md",text);
}

//加载信息
function load_info(){
	if(fs.existsSync('./info.json')){
		var temp=JSON.parse(fs.readFileSync('./info.json'));
		for(t in temp){
			info[t]=temp[t];
		}
		
		if(info.modifyed==true){
			if(fs.existsSync('./app/temp/temp.md')){
				loadFile('./app/temp/temp.md');
			}
		}
	}
}
//保存数据
function save_info(){
	
	fs.writeFileSync("./info.json",JSON.stringify(info));
}
//关闭事件
function close_handler(){
	
	save_info();
	win=null;
}

//调整编辑器大小
function resize(width,height){
	//取得各部件大小
	var caption=$('#caption');

	var edit=$(MarkdownEdit.current_edit.parentNode.parentNode);

	var d=22;
	edit.height(height-caption.height()-d);
	var h=height-caption.height()-36-d+'px';
	MarkdownEdit.current_edit.style.height=h;
	MarkdownEdit.current_edit.parentNode.parentNode.preview_obj.style.height=height-caption.height()-d-36+'px';

}