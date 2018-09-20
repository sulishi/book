function renew(obj){
    ajax({
        url: '/user/renew',
        type: 'POST',
        data: {
           renewnumber:obj.getAttribute('renewnumber'),
           id1:obj.getAttribute('id1'),
           id2:obj.getAttribute('id2'),
        },
        dataType: 'json',
        async: false,
        success: function(result) {
           alert(result);
        }
    })
}

