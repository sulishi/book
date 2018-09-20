
need('ok').onclick = function() {
    ajax({
        url: '/user/book',
        type: 'POST',
        data: {
            pwd: need('pwd').value
        },
        dataType: 'json',
        async: false,
        success: function(result) {
           if(result == '密码不正确，请重新输入'){
              alert(result);
              window.location.reload();
           }
           else{
            window.location.reload();
           }
        }
    })
}