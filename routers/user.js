var express = require('express');
var router = express.Router();
var charset = require('superagent-charset');
var superagent = charset(require('superagent'));
var cookie = require('cookie-parser');
var User = require('../models/User');
var cheerio  = require('cheerio');
var bodyparser = require('body-parser');
var urlencode = require('urlencode');
router.use(cookie());

router.use(bodyparser.urlencoded({extended:true}));

/**
 * 用户登录
 * 获取学号的密码
 * 
 */
var grant_type = "authorization_code"
var getTokrnUrl = "https://zypc.xupt.edu.cn/oauth/token"
var URL_use = "https://zypc.xupt.edu.cn/oauth/userinfo"
var getCodeUrl = "https://zypc.xupt.edu.cn/oauth/authorize"
var clientId = '1eaaafd537ac792a14030158d4a9fae032dd33a08bc6c891737fff70ca102ce9';
var secret =    'aabf2c93340bd23e8afa6beca71274684e17875a6c195828386ef0f9b47d3006';
var state = "1"
var response_type = "code"
var redirect_uri = 'http://127.0.0.1:8000/user/login';
router.get('/',function(req,res){
    var URL = getCodeUrl + "?" + "response_type=" + response_type + "&" + "client_id=" + clientId + "&" + "state=" + state + "&" + "redirect_uri=" + redirect_uri;
    res.redirect(URL);
})
router.get('/login',function(req,res,next){
    var code = req.query.code;
    this.code = code;
    res.redirect('/user/token')
});
function getinfor(URL_token) {
    return new Promise(function (resolve, reject) {
        //获取token的请求
        superagent
            .post(URL_token)
            .end(function (err, res) {
                if (err) {
                    reject('获取token失败')

                } else {
                    var access_token = res.body.access_token //获取到token'
                    
                    var URL_userinfor = URL_use + "?" + "access_token=" + access_token //请求数据的接口
                    //获取用户信息的请求
                    superagent
                        .get(URL_userinfor)
                        .end(function (err, res) {
                            if (err) {
                                reject('获取用户信息失败')
                            } else {
                                
                                resolve({inform:res.body,token:access_token}) //获取到用户信息，并将用户信息作为参数传给resolve,,将会在.then()中执行
    
                            }
                        })
                }

            })
    })
};
router.get('/token',function(req,res,next){
    var URL_token = getTokrnUrl + "?" + "grant_type=" + grant_type + "&" + "client_id=" + clientId + "&" + "client_secret=" + secret + "&" + "code=" + this.code + "&" + "redirect_uri=" + redirect_uri;
    getinfor(URL_token).then(data => { //将数据发送给前端
        res.cookie('student_no',data.inform.student_no);
        User.findOne({
            username:data.inform.student_no
        }).then(function(userinfo){
            if(userinfo){
                userinfo.token = data.token;
                userinfo.save();
                console.log(userinfo)
            }
            else{
                var user = new User({
                    username:data.inform.student_no,
                    token:data.token
                    });
                    user.save();
            }
        })
        res.redirect('/user/inform')
    }).catch(data => { //错误处理
        res.send(data)
    })
});
/**
 * 获取借阅信息
 */

router.get('/inform',function(req,res,next){
    if(req.headers.cookie == undefined){
        res.redirect('/user');
        return;
    }
    var a  = req.cookies.student_no;
    User.findOne({
        username:a
    }).then(function(userInfo){
        if(userInfo){
            getCookie(userInfo.username,userInfo.password).then(function(meinform){
                var a = '当前没有借阅信息'
             if(meinform == ''){
                    res.render('main/book',{a:a,url:'/user/inform',last:'/'
                })
                    return;
                }
                else{
               res.render('main/book',{meinform:meinform,
                collect:userInfo.collect
                ,url:'/user/inform'});}
                return
            })
           
        } 
        else{   
            res.render('main/user');
        }
    })
});
function getCookie(barcode,pwd){
    return new Promise(function(reslove,reject){
        superagent
    .post('http://222.24.3.7:8080/opac_two/reader/login_app.jsp')
    .send('login_type=barcode&barcode='+barcode+'&password='+pwd+'&_=')
    .charset('gbk')
    .set('Content-type','application/x-www-form-urlencoded')
    .end(function(err,res){
        var a = /str_message=密码不正确/;
        if(a.test(res.text) == false){
       cookies = res.header['set-cookie'];
       getData(cookies).then(function(meinform){
          reslove(meinform)
       });}
       else{
           reslove('密码不正确，请重新输入');
       }
    })
    })
    
}
function getData(cookies){
    return new Promise(function(reslove,reject){
        superagent
            .get('http://222.24.3.7:8080/opac_two/reader/jieshuxinxi.jsp')
            .charset('gbk')
            .set('Cookie',cookies)
            .set('Content-type','application/x-www-form-urlencoded')
            .end(function(err,res){
                if(err){
                    reject(err)
                }
                else{
                    var meinform = [];
                var $ = cheerio.load(res.text);
                $(' table tbody tr').slice(1).each(function(i){
                    var  xujiereg =  new RegExp(/Renew((.*));/);
                    var guoqi = /过期暂停/;
                    var xuejieinform =$(this).html().match(xujiereg);
                    var informreg = new RegExp(/&apos;(.*)&apos;,&apos;(.*)&apos;,&apos;(.*)&apos;/);
                    if(xuejieinform){var  list = xuejieinform[2].match(informreg);
                          
                    }
                    else{var list = $(this).text().match(guoqi)
                }
                if(list == null){
                   
                }
               else if(list[1]){ var book= {
                        bookname:$(this).find('td').eq(2).text(),
                        number:$(this).find('td').eq(3).text(),
                        where:$(this).find('td').eq(4).text(),
                        tip:$(this).find('td').eq(5).text(),
                        data:$(this).find('td').eq(6).text(),
                        renewnumber:list[1],
                        id1:list[2],
                        id2:list[3]
                    }
                    
                }
                else{
                     var book= {
                        bookname:$(this).find('td').eq(2).text(),
                        number:$(this).find('td').eq(3).text(),
                        where:$(this).find('td').eq(4).text(),
                        tip:$(this).find('td').eq(5).text(),
                        data:$(this).find('td').eq(6).text(),
                    }
                }
                if(book){
                    meinform.push(book);}
             })
             reslove(meinform);
                }
                 
        }); 
      
    })
};

/**
 * 
 续借函数
 */
function getxujie(action,shuhao,id1,id2){
    return new Promise((resolve,reject)=>{
    superagent
        .get('http://222.24.3.7:8080/opac_two/reader/jieshuxinxi.jsp?'+'action='+action+'&book_barcode='+shuhao+'&department_id='+id1+'&library_id='+id2)
        .charset('gbk')
        .end(function(err,res){ 
            var tip = []
             var $ = cheerio.load(res.text);
            var c = /alert\("(.*)"\)/;
           $('body>script').each(function(){
               var sc = $(this).html();
                var renewcontent = new RegExp(/alert\("(.*)"\)/);
                var renewfalse = /alert\("续借失败/;
                var renewtrue = /alert\("续借成功/;
                h = sc.match(renewcontent);
                if(h!= null)
               { 
                   if(renewfalse.test(h.input)== true)
                {
                   tip.push('续借失败,您已经续借过,再次续借请前往图书馆')
                }
                else if(renewtrue.test(h.input) == true )
                {
                    tip.push('续借成功,续借30天')
                }
            }
           })
            resolve(tip);
        })
    })
    }
router.post('/renew',function(req,res,next){
    var renewnumber = req.body.renewnumber;
    var id1 = req.body.id1;
    var id2 = req.body.id2;
    var action = 'Renew';
    getxujie(action,renewnumber,id1,id2).then(function(tip){
        res.json(tip);
    });
})

/**
 * 收藏
 */
router.post('/collect',function(req,res,next){
    if(req.cookies.student_no == undefined){
       res.json('请先登录')
    }
    else{
    var booknumber = req.body.booknumber;
    User.findOne({
        username:req.cookies.student_no
    }).then(function(userInfo){
        if(userInfo.collect== '')
        {
        userInfo.collect.push(booknumber);
        res.json('收藏成功')
          return userInfo.save();
        }
        else{ 
            for(var i = 0;i<userInfo.collect.length;i++){
                if(booknumber == userInfo.collect[i]){
                    res.json('该书已经被收藏过了');
                    return;
                }
            }
            userInfo.collect.push(booknumber);
            res.json('收藏成功')
            return userInfo.save();

    }
})}
});
router.get('/collect',function(req,res,next){
    if(req.cookies.student_no == undefined){
        res.redirect('/user/inform')
    }
    else{
    User.findOne({
        username:req.cookies.student_no
    }).then(function(user){
         User.findOne({
             username:req.cookies.student_no
         }).then(function(userinfo){
             var bookcollect = [];
             if(userinfo.collect == ''){
                res.render('main/collect',{url:'/user/collect',a:'当前没有收藏',last:'/'})
                return;
             }
             else{
             for(var i = 0;i<userinfo.collect.length;i++){
                getinform(userinfo.collect[i],1,3).then(function(a){
                    bookcollect.push(a);
                   if(bookcollect.length == i){ 
                       res.render('main/collect',{url:'/user/collect',bookcollect:bookcollect})
                        
                   }
                })
             }
            }
         })
    })
    }
})
function getinform(bookname,page,type){
    return new Promise((resolve,reject)=>{
         var gbkbook = urlencode(bookname,'gbk');
    superagent
        .post('http://222.24.3.7:8080/opac_two/search2/searchout.jsp')
        .charset('gbk')
        .send('library_id=all&recordtype=all&kind=simple&suchen_word='+gbkbook+'&suchen_type='+type+'&suchen_match=qx&kind=simple&show_type=wenzi&snumber_type=Y&search_no_type=Y&searchtimes=1&size=20&curpage='+page+'&orderby=pubdate_date&ordersc=desc&page=2&pagesize=20')
        .end(function(err,res){
            if(err){
               reject(err);
            }
            else{
                var inform = [];
                var $ = cheerio.load(res.text);
               inform.number =  $('table tbody tr td .opac_red strong').eq(0).text();
                $('#searchout_tuwen table tbody tr').slice(1).each(function(i){
                    var book= {
                        bookname:$(this).find('td').eq(1).text(),
                        author:$(this).find('td').eq(2).text(),
                        press:$(this).find('td').eq(3).text(),
                        isbn:$(this).find('td').eq(4).text(),
                        year:$(this).find('td').eq(5).text(),
                        search:$(this).find('td').eq(6).text(),
                        have:$(this).find('td').eq(7).text(),
                    }
                    var it = /^t/i;
                    var lit = /^i/i;
                    var eng = /^h/i;
                    var econ = /^f/i;
                    var phy =  /^[O-SU-Z]/i;
                    var  sheke = /^[a-egj-k]/i;
                    if(it.test(book.search)){
                        book.where = '自动化/计算机书库'
                    }
                    else if(lit.test(book.search)){
                        book.where = '文艺书库'
                    }
                    else if(eng.test(book.search)){
                        book.where = '外文书库'
                    }
                    else if(econ.test(book.search)){
                        book.where = '经济书库'
                    } else if(phy.test(book.search)){
                        book.where = '数理书库'
                    }
                   else if(sheke.test(book.search)){
                        book.where = '社科书库'
                    } 
                    else{
                        book.where = '数据丢失！'
                    }
                    inform.push(book);
                    
                });
                resolve(inform);
            }
        })
    })
    }
router.post('/nocollect',function(req,res){
    var booknumber = req.body.booknumber;
    User.findOne({
        username:req.cookies.student_no
    }).then(function(userInfo){
        for(var i = 0;i<userInfo.collect.length;i++){
            if(booknumber == userInfo.collect[i]){
                User.update({username:req.cookies.student_no},
                  {$pull:{"collect":booknumber}
                }).then(function(){
                     res.json('删除成功');
                return;
                })
               
            }
        }
    })
})
module.exports = router;