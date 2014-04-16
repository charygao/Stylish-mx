var rt=window.external.mxGetRuntime(),br=rt.create('mx.browser');

// Debug
/*var bugs={};
window.addEventListener('error',function(e){
	if(!bugs[e.lineno]) {
		bugs[e.lineno]=e.message;
		var n=window.webkitNotifications.createNotification('','Error - Stylish','Line '+e.lineno+' >>> '+e.message);
		n.show();
	}
});*/

function _(k,a){
	var v=rt.locale.t(k);
	try{
		v=JSON.parse(v).replace(/\$(?:\{(\d+)\}|(\d+))/g,function(v,g1,g2){
			v=g1||g2;v=a[v-1];return v==null?'':v;
		});
	}catch(e){
		v='';
	}
	//return v||k;
	return v;
};
function initI18n(callback){
	window.addEventListener('DOMContentLoaded',function(){
		var nodes=document.querySelectorAll('*[data-i18n]'),i;
		for(i=0;i<nodes.length;i++) nodes[i].innerHTML=_(nodes[i].getAttribute('data-i18n'));
		if(callback) callback();
	},true);
}
function getUniqueId(){return Date.now()+Math.random().toString().slice(1);}
function initMessage(map){
	var id=getUniqueId(),callbacks={};
	if(!map) map={};
	map.Callback=function(o){
		var f=callbacks[o.id];
		if(f) {
			f(o.data);
			delete callbacks[o.id];
		}
	};
	rt.listen(id,function(o){
		var f=map[o.cmd];
		if(f) f(o.data);
	});
	return function(o,callback){
		o.src={id:id};
		if(callback) {
			o.callback=getUniqueId();
			callbacks[o.callback]=callback;
		}
		rt.post('Background',o);
	};
}
function broadcast(s){
	var j,t;for(j=0;t=br.tabs.getTab(j);j++) br.executeScript(s,t.id);
}

function injectContent(s){br.executeScript('if(window.mx)try{'+s+'}catch(e){}');}
function notify(msg){
	window.webkitNotifications.createNotification('',_('extName'),msg).show();
}
