
function ajax(options){
    options = options || {};
    options.type = (options.type || "GET").toUpperCase();
    /**
     * 返回值类型默认为json
     * */
    options.dataType = options.dataType || 'json';
    /**
     * 默认为异步请求
     * */
    options.async = options.async || true;
    /**
     * 对需要传入的参数的处理
     * */
    var params = getParams(options.data);
    var xmlhttp;
	if (window.XMLHttpRequest)
	{
		//  IE7+, Firefox, Chrome, Opera, Safari 浏览器执行代码
		xmlhttp=new XMLHttpRequest();
	}
	else
	{
		// IE6, IE5 浏览器执行代码
		xmlhttp=new ActiveXObject("Microsoft.XMLHTTP");
	}
	xmlhttp.onreadystatechange=function()
	{
		if (xmlhttp.readyState==4 && xmlhttp.status==200)
		{
            if(options.type == 'POST')
            {
            result = JSON.parse(xmlhttp.responseText);
            options.success(result);
            }
            else{
            options.success();
            }
        }
        else{
            options.fail;
        }
    }
    if(options.type == 'GET')
    {
	xmlhttp.open("GET",options.url + '?' + params ,options.async);
    xmlhttp.send();
    }
    else if(options.type == 'POST'){
        xmlhttp.open('POST',options.url,options.async);
        xmlhttp.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        /**
         * 发送请求参数
         */
        xmlhttp.send(params);
    }
}
function getParams(data) {
    var arr = [];
    for (var param in data){
        arr.push(encodeURIComponent(param) + '=' +encodeURIComponent(data[param]));
    }
    // arr.push(('randomNumber=' + Math.random()).replace('.'));
    return arr.join('&');
}

function need(obj){
    return document.getElementById(obj);
}


function collect(obj){
    ajax({
        url:'/user/collect',
        type:'POST',
        data:{
           booknumber:obj.getAttribute('number')
        },
        dataType: 'json',
        async: false,
        success: function(result) {
            if(result == '收藏成功')
            {
                obj.style.color = '#ddd'
            }
            else if(result == '请先登录')
            {
                window.location ='/user/inform'
            }
           alert(result);
        }

    })
}
function nocollect(obj){
    ajax({
        url:'/user/nocollect',
        type:'POST',
        data:{
           booknumber:obj.getAttribute('number')
        },
        dataType: 'json',
        async: false,
        success: function(result) {
                obj.style.backgroundColor= '#ddd'
           alert(result);
        }

    })
}
