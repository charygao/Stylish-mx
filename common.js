var rt=window.external.mxGetRuntime(),br=rt.create('mx.browser'),
    guid='__{25d5eed5-1c91-4dde-ba91-9b6c9f786b1f}_';
function format(){
	var a=arguments;
	if(a[0]) return a[0].replace(/\$(?:\{(\d+)\}|(\d+))/g,function(v,g1,g2){return a[g1||g2]||v;});
}
function _(t){
	var l=t.replace(/[%+=]/g,function(v){return '%'+v.charCodeAt().toString(16);}).replace(/ /g,'+');
	l=rt.locale.t(l);
	return l?JSON.parse(l):t;
};
function initFont(){
	var s=document.createElement('style');
	s.innerHTML=_('font');
	document.head.appendChild(s);
}
function unsafeExecute(id,funcName,args){
	if(!id) id=br.tabs.getCurrentTab().id;
	br.executeScript('var p=document.createElement("script");p.innerHTML=\'(function(p){p&&p('+JSON.stringify(args)+');})(window["'+guid+funcName+'"]);\';document.documentElement.appendChild(p);document.documentElement.removeChild(p);',id);
}
function unsafeBroadcast(funcName,args){var j,t;for(j=0;t=br.tabs.getTab(j);j++)unsafeExecute(t.id,funcName,args);}

function sConfig(){this.load();}
sConfig.prototype={
	key:'data',
	load:function(){
		var v=rt.storage.getConfig(this.key);
		if(v) try{v=JSON.parse(v);}catch(e){v=0;}
		this.data=v||{
			ids:[],
			map:{},
			temp:{},
			installFile:true,
			isApplied:true,
		};
		this.ids=this.data.ids;
		this.map=this.data.map;
		this.temp=this.data.temp;
	},
	set:function(key,val){this.data[key]=val;this.save();},
	save:function(){
		rt.storage.setConfig(this.key,JSON.stringify(this.data));
	},
};
var _data=new sConfig();
