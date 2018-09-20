if(need('search') != null){
    need('search').onclick = function(){
        if(need('book').value.length){
        var realLength = 0, charCode = -1;
        for (var i = 0; i <need('book').value.length; i++) {
        charCode = need('book').value.charCodeAt(i);
        if (charCode >= 0 && charCode <= 128) 
           realLength += 1;
        else
           realLength += 2;
      }  
      if(realLength<2){
             alert('请输入字符大于二的内容');
             need('book').value = '';
             return ;
        }
    }
    else{
        alert('请输入要查找的书名');
        return ;
    }
      
        ajax({
            url:'/main/search',
            data:{book :need('book').value},
            dataType:'json',
            async:false,
            success:function(){
                window.location = '/main/search?book='+need('book').value+'&page=1'
            }
        })
    }
    }
    window.onbeforeunload = function(){
        document.cookie;
    }
    