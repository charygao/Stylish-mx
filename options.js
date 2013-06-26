var $=document.getElementById.bind(document),
		N=$('main'),L=$('sList'),O=$('overlay');
zip.workerScriptsPath='lib/zip.js/';
function getDate(t){var d=new Date();d.setTime(t*1000);return d.toLocaleDateString();}
function getTime(r){
	var d=new Date(),z,m=r.updated.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)\s+(\+|-)(\d+)/);
	d.setUTCFullYear(parseInt(m[1],10));
	d.setUTCMonth(parseInt(m[2],10)-1);
	d.setUTCDate(parseInt(m[3],10));
	d.setUTCHours(parseInt(m[4],10));
	d.setUTCMinutes(parseInt(m[5],10));
	d.setUTCSeconds(parseInt(m[6],10));
	d.setUTCMilliseconds(0);
	d=d.getTime()/1000;
	z=parseInt(m[8].substr(0,2),10)*60+parseInt(m[8].substr(2),10);z*=60;
	if(m[7]!='-') z=-z;d+=z;
	return d;
}
function getName(n){
	return n.name?n.name.replace(/&/g,'&amp;').replace(/</g,'&lt;'):'<em>'+_('Null name')+'</em>';
}

// Main options
function loadName(d,n){
	var a=d.firstChild;
	if(n.url) a.href=n.url;
	a.title=n.name;
	a.innerHTML=getName(n);
}
function loadItem(d,n,r){
	d.innerHTML='<a class="name ellipsis" target=_blank></a>'
	+'<span class=updated>'+(n.updated?_('Last updated: ')+getDate(n.updated):'')+'</span>'
	+(n.metaUrl?'<a href=# data=update class=update>'+_('Check for updates')+'</a> ':'')
	+'<span class=message></span>'
	+'<div class=panel>'
		+'<button data=edit>'+_('Edit')+'</button> '
		+'<button data=enable>'+(n.enabled?_('Disable'):_('Enable'))+'</button> '
		+'<button data=remove>'+_('Remove')+'</button>'
	+'</div>';
	d.className=n.enabled?'':'disabled';
	loadName(d,n);
	if(r&&r.message) d.querySelector('.message').innerHTML=r.message;
}
function addItem(n){
	var d=document.createElement('div');
	loadItem(d,n);
	L.appendChild(d);
	return d;
}
L.onclick=function(e){
	var o=e.target,d=o.getAttribute('data'),p;
	if(!d) return;
	e.preventDefault();
	for(p=o;p&&p.parentNode!=L;p=p.parentNode);
	var i=Array.prototype.indexOf.call(L.childNodes,p);
	switch(d){
		case 'edit':
			edit(i);
			break;
		case 'enable':
			e=map[ids[i]];
			if(e.enabled=!e.enabled) {
				p.classList.remove('disabled');
				o.innerText=_('Disable');
			} else {
				p.classList.add('disabled');
				o.innerText=_('Enable');
			}
			rt.post('SaveStyle',e);
			break;
		case 'remove':
			rt.post('RemoveStyle',i);
			delete map[ids.splice(i,1)[0]];
			L.removeChild(p);
			break;
		case 'update':
			check(i);
			break;
	}
};
rt.listen('GotStyle',function(o){ids.push(o.id);o=addItem(map[o.id]=o);});
$('bNew').onclick=function(){rt.post('NewStyle');};
$('bUpdate').onclick=function(){
	for(var i=0;i<ids.length;i++) if(map[ids[i]].metaUrl) check(i);
};
var panel=N;
function switchTo(D){
	panel.classList.add('hide');D.classList.remove('hide');panel=D;
}
var dialogs=[];
function showDialog(D,z){
	if(!dialogs.length) {
		O.classList.remove('hide');
		setTimeout(function(){O.classList.add('overlay');},1);
	}
	if(!z) z=dialogs.length?dialogs[dialogs.length-1].zIndex+1:1;
	dialogs.push(D);
	O.style.zIndex=D.style.zIndex=D.zIndex=z;
	D.classList.remove('hide');
	D.style.top=(window.innerHeight-D.offsetHeight)/2+'px';
	D.style.left=(window.innerWidth-D.offsetWidth)/2+'px';
}
function closeDialog(){
	dialogs.pop().classList.add('hide');
	if(dialogs.length) O.style.zIndex=dialogs.length>1?dialogs[dialogs.length-1]:1;
	else {
		O.classList.remove('overlay');
		setTimeout(function(){O.classList.add('hide');},500);
	}
}
O.onclick=function(){
	if(dialogs.length) (dialogs[dialogs.length-1].close||closeDialog)();
};
function confirmCancel(dirty){
	return !dirty||confirm(_('Modifications are not saved!'));
}
initFont();initI18n();

// Advanced
var A=$('advanced');
$('bAdvanced').onclick=function(){showDialog(A);};
$('cInstall').onchange=function(){rt.post('SetOption',{key:'installFile',data:this.checked});};
$('aExport').onclick=function(){showDialog(X);xLoad();};
$('aImport').onchange=function(e){
	zip.createReader(new zip.BlobReader(e.target.files[0]),function(r){
		r.getEntries(function(e){
			function getFiles(){
				var i=e.shift();
				if(i) i.getData(writer,function(t){
					rt.post(/\.json$/.test(i.filename)?'ParseJSON':'ParseFirefoxCSS',
						{data:t});
					count++;
					getFiles();
				}); else {
					alert(format(_('$1 item(s) are imported.'),count));
					location.reload();
				}
			}
			var i,s={},writer=new zip.TextWriter(),count=0;
			for(i=0;i<e.length;i++) if(e[i].filename=='Stylish') break;
			if(i<e.length) e.splice(i,1)[0].getData(writer,function(t){
				try{
					s=JSON.parse(t);
				}catch(e){
					s={};
					console.log('Error parsing Stylish configuration.');
				}
				getFiles();
			}); else getFiles();
		});
	});
};
A.close=$('aClose').onclick=closeDialog;

// Export
var X=$('export'),xL=$('xList'),xE=$('bExport'),xF=$('cFirefox');
function xLoad() {
	xL.innerHTML='';xE.disabled=false;xE.innerHTML=_('Export');
	ids.forEach(function(i){
		var d=document.createElement('div');
		d.className='ellipsis';
		d.title=map[i].name;
		d.innerHTML=getName(map[i]);
		xL.appendChild(d);
	});
}
xF.onchange=function(){rt.post('SetOption',{key:'firefoxCSS',data:this.checked});};
xL.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	t.classList.toggle('selected');
};
$('bSelect').onclick=function(){
	var c=xL.childNodes,v,i;
	for(i=0;i<c.length;i++) if(!c[i].classList.contains('selected')) break;
	v=i<c.length;
	for(i=0;i<c.length;i++) if(v) c[i].classList.add('selected'); else c[i].classList.remove('selected');
};
X.close=$('bClose').onclick=closeDialog;
xE.onclick=function(e){
	e.preventDefault();
	this.disabled=true;this.innerHTML=_('Exporting...');
	var i,c=[];
	for(i=0;i<ids.length;i++)
		if(xL.childNodes[i].classList.contains('selected')) c.push(ids[i]);
	rt.post('ExportZip',{data:c});
};
function getFirefoxCSS(c){
	var d=[];
	['id','name','url','metaUrl','updateUrl','updated','enabled'].forEach(function(i){
		if(c[i]!=undefined) d.push('/* @'+i+' '+String(c[i]).replace(/\*/g,'+')+' */');
	});
	c.data.forEach(function(i){
		var p=[];
		i.domains.forEach(function(j){p.push('domain('+JSON.stringify(j)+')');});
		i.regexps.forEach(function(j){p.push('regexp('+JSON.stringify(j)+')');});
		i.urlPrefixes.forEach(function(j){p.push('url-prefix('+JSON.stringify(j)+')');});
		i.urls.forEach(function(j){p.push('url('+JSON.stringify(j)+')');});
		d.push('@-moz-document '+p.join(',\n')+'{\n'+i.code+'\n}\n');
	});
	return d.join('\n');
}
function exportStart(o){
	function addFiles(){
		if(!writer) {	// create writer
			zip.createWriter(new zip.BlobWriter(),function(w){writer=w;addFiles();});
			return;
		}
		adding=true;
		var i=files.shift();
		if(i) {
			if(i.name) {	// add file
				writer.add(i.name,new zip.TextReader(i.content),addFiles);
				return;
			} else {	// finished
				writer.close(function(b){
					xE.innerHTML='导出完成';
					var u=URL.createObjectURL(b),e=document.createEvent('MouseEvent');
					e.initMouseEvent('click',true,true,window,0,0,0,0,0,false,false,false,false,0,null);
					xH.href=u;
					xH.download='styles.zip';
					xH.dispatchEvent(e);
					writer=null;
					X.close();
					URL.revokeObjectURL(u);
					xH.removeAttribute('href');
					xH.removeAttribute('download');
				});
			}
		}
		adding=false;
	}
	function addFile(o){
		files.push(o);
		if(!adding) addFiles();
	}
	var writer=null,files=[],adding=false,xH=$('xHelper'),
			n,_n,names={},s={settings:o.settings};
	o.data.forEach(function(c){
		var j=0;
		n=_n=c.name||'Noname';
		while(names[n]) n=_n+'_'+(++j);names[n]=1;
		if(xF.checked) addFile({name:n+'.user.css',content:getFirefoxCSS(c)});
		else addFile({name:n+'.json',content:JSON.stringify(c)});
	});
	addFile({name:'Stylish',content:JSON.stringify(s)});
	addFile({});	// finish adding files
}
rt.listen('ExportStart',exportStart);

// Update checker
function check(i){
	var l=L.childNodes[i],c=map[ids[i]],o=l.querySelector('[data=update]'),m=l.querySelector('.message'),d;
	m.innerHTML=_('Checking for updates...');
	o.classList.add('hide');
	function update(){
		m.innerHTML=_('Updating...');
		req=new window.XMLHttpRequest();
		req.open('GET', c.updateUrl, true);
		req.onload=function(){
			rt.post('ParseCSS',{data:{status:req.status,id:c.id,updated:d,code:req.responseText}});
			o.classList.remove('hide');
		};
		req.send();
	}
	var req=new window.XMLHttpRequest();
	req.open('GET', c.metaUrl, true);
	req.onload=function(){
		try {
			d=getTime(JSON.parse(this.responseText));
			if(!c.updated||c.updated<d) {
				if(c.updateUrl) return update();
				else m.innerHTML='<span class=new title="'+_('Please go to homepage for update since there are options for this style.')+'">'+_('New version found.')+'</span>';
			} else m.innerHTML=_('No update found.');
		} catch(e) {
			m.innerHTML=_('Failed fetching update information.');
			console.log(e);
		}
		o.classList.remove('hide');
	};
	req.send();
}

// Style Editor
var M=$('editor'),S=$('mSection'),I=$('mName'),
    rD=$('mDomain'),rR=$('mRegexp'),rP=$('mUrlPrefix'),rU=$('mUrl'),
    eS=$('mSave'),eSC=$('mSaveClose');
var T=CodeMirror.fromTextArea($('mCode'),{
	lineNumbers:true,
	matchBrackets:true,
	mode:'text/css',
	lineWrapping:true,
	indentUnit:4,
	indentWithTabs:true,
	extraKeys:{"Enter":"newlineAndIndentContinueComment"}
});
function cloneData(d){
	var c=[];
	d.forEach(function(i){
		if(i.code) c.push({
			name:i.name,
			domains:i.domains.concat(),
			regexps:i.regexps.concat(),
			urlPrefixes:i.urlPrefixes.concat(),
			urls:i.urls.concat(),
			code:i.code
		});
	});
	return c;
}
function edit(i){
	switchTo(M);
	M.cur=i;M.css=map[ids[M.cur]];
	M.data=cloneData(M.css.data);
	S.innerHTML='';S.cur=0;S.dirty=false;
	eS.disabled=eSC.disabled=true;
	I.value=M.css.name;
	if(M.data.length) for(var i=0;i<M.data.length;i++) mAddItem(M.data[i].name||i+1);
	else addSection();
	mShow();
}
function mAddItem(n){
	var d=document.createElement('div');
	d.innerText=n;
	S.appendChild(d);
	return d;
}
function split(t){return t.replace(/^\s+|\s+$/g,'').split(/\s*\n\s*/).filter(function(e){return e;});}
function mSection(r){
	if(M.data[S.cur]){
		if(S.dirty){
			S.dirty=false;
			M.data[S.cur].name=S.childNodes[S.cur].innerText;
			M.data[S.cur].domains=split(rD.value);
			M.data[S.cur].regexps=split(rR.value);
			M.data[S.cur].urlPrefixes=split(rP.value);
			M.data[S.cur].urls=split(rU.value);
		}
		if(!T.isClean()) {
			M.data[S.cur].code=T.getValue();T.markClean();
		}
		if(r) S.childNodes[S.cur].classList.remove('selected');
	}
}
function mSave(){
	if(!eS.disabled){
		M.css.name=I.value;
		mSection();
		eS.disabled=eSC.disabled=true;
		return true;
	} else return false;
}
function mShow(){
	var c=S.childNodes[S.cur];
	rD.disabled=rR.disabled=rP.disabled=rU.disabled=!c;
	T.setOption('readOnly',!c&&'nocursor');S.dirty=true;
	if(c) {
		S.childNodes[S.cur].classList.add('selected');
		rD.value=M.data[S.cur].domains.join('\n');
		rR.value=M.data[S.cur].regexps.join('\n');
		rP.value=M.data[S.cur].urlPrefixes.join('\n');
		rU.value=M.data[S.cur].urls.join('\n');
		T.setValue(M.data[S.cur].code);
	} else T.setValue(rD.value=rR.value=rP.value=rU.value='');
	T.markClean();T.getDoc().clearHistory();S.dirty=false;
}
function mClose(){
	switchTo(N);
	loadName(L.childNodes[M.cur],map[ids[M.cur]]);
	M.cur=M.css=null;
}
function bindChange(e,f){e.forEach(function(i){i.onchange=f;});}
M.markDirty=function(){eS.disabled=eSC.disabled=false;};
T.on('change',S.markDirty=function(){if(S.dirty) return;S.dirty=true;M.markDirty();});
bindChange([rD,rR,rP,rU],S.markDirty);
bindChange([I],M.markDirty);
S.onclick=function(e){
	var t=e.target;
	if(t.parentNode!=this) return;
	if(!t.classList.contains('selected')) {
		mSection(1);
		S.cur=Array.prototype.indexOf.call(S.childNodes,t);
		mShow();
	} else renameSection(t);
};
function addSection(){
	var d={name:'',domains:[],regexps:[],urlPrefixes:[],urls:[],code:''};
	mSection(1);
	S.cur=M.data.length;
	M.data.push(d);
	mAddItem(M.data.length);
	mShow();
}
function renameSection(t){
	if(!t) return;
	var o=prompt(format(_('Rename Section "$1" to:'),t.innerText));
	if(o!=null) {t.innerText=o||S.cur+1;S.markDirty();}
}
$('mNew').onclick=addSection;
$('mDel').onclick=function(){
	if(S.cur) {
		M.data.splice(S.cur,1);
		S.removeChild(S.lastChild);
		for(var i=S.cur;i<M.data.length;i++) {
			S.childNodes[i].innerText=M.data[i].name||i+1;
		}
		M.markDirty();mShow();
	}
};
eS.onclick=function(){
	if(mSave()) {M.css.data=cloneData(M.data);rt.post('SaveStyle',M.css);}
};
eSC.onclick=function(){
	if(mSave()) {M.css.data=M.data;rt.post('SaveStyle',M.css);}
	mClose();
};
M.close=$('mClose').onclick=function(){if(confirmCancel(!eS.disabled)) mClose();};
function ruleFocus(e){e.target.parentNode.style.width='50%';}
function ruleBlur(e){e.target.parentNode.style.width='';}
[rD,rR,rP,rU].forEach(function(i){i.onfocus=ruleFocus;i.onblur=ruleBlur;});

// Load at last
var ids,map;
function loadOptions(o){
	ids=o.ids;map=o.map;L.innerHTML='';
	ids.forEach(function(i){addItem(map[i]);});
	$('cInstall').checked=o.installFile;
	xF.checked=o.firefoxCSS;
}
rt.listen('GotOptions',function(o){loadOptions(o);});	// loadOptions can be rewrited
rt.listen('UpdateItem',function(r){
	if(!r.obj||!('item' in r)||r.item<0) return;
	map[r.obj.id]=r.obj;
	switch(r.status){
		case 1:ids.push(r.obj.id);addItem(r.obj);break;
		default:loadItem(L.childNodes[r.item],r.obj,r);
	}
});
rt.post('GetOptions');
