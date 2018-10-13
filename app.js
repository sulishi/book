var express = require('express');
//类似于jq处理爬取到的数据
var cheerio = require('cheerio');
//修改编码  但是好像没有用到
var charset = require('superagent-charset');
var superagent = charset(require('superagent'));
//加载body-parser 处理post过来的数据
var bodyparser = require('body-parser');
//加载cookies模块
var cookies= require('cookies');
//加载模板处理模块
var swig = require('swig');
//创建app应用
var app = express();
//定时查询
var schedule = require('node-schedule');

//用户模型
var User = require('./models/User');
//数据库加载
var mongoose = require('mongoose');
//静态文件托管
app.use('/public',express.static(__dirname + '/public'));
//配置应用模板
app.engine('html',swig.renderFile);
app.set('views','../book/views');
app.set('view engine','html');
swig.setDefaults({
    cache:false
});
app.use('/user',require('./routers/user'));
app.use('/main',require('./routers/main'));

app.use(bodyparser.urlencoded({extended:true}));

app.get('/',function(req,res,next){
    res.render('main/index',{
        url:'/'
    })
})
app.post('/user/book',function(req,res){
    var username = req.cookies.student_no;
    var pwd = req.body.pwd;
    User.findOne({
        username:username
    }).then(function(userInfo){
        if(userInfo.pwd){
            getCookie(userInfo.username,userInfo.password,token).then(function(meinform){
                res.json(meinform);
                return;
            })
        } 
        else{   
            userInfo.password = pwd;
        getCookie(username,pwd,token).then(function(meinform){
            if(meinform == '密码不正确，请重新输入')
            {
                res.json(meinform);
            }
            else{
            res.json({meinform:meinform,
            url:'/user/book'});
            return userInfo.save();
            }           
        })
        
    }
    })

})
function getCookie(barcode,pwd,token){
    return new Promise(function(reslove,reject){
        superagent
    .post('http://222.24.3.7:8080/opac_two/reader/login_app.jsp')
    .charset('gbk')
    .send('login_type=barcode&barcode='+barcode+'&password='+pwd+'&_=')
    .set('Content-type','application/x-www-form-urlencoded')
    .end(function(err,res){
        var a = /str_message=密码不正确/;
        if(a.test(res.text) == false){
       cookies = res.header['set-cookie'];
       getData(cookies,token).then(function(meinform){
          reslove({meinform:meinform,token:token})
       });}
       else{
           reslove('密码不正确，请重新输入');
       }
    })
    })
    
}
function getData(cookies,token){
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
 * 首页
 * 根据功能划分
 */


// //监听HTTP请求

/**
 * 数据库查询
 */
var rule     = new schedule.RecurrenceRule();  
rule.dayOfWeek = [0, new schedule.Range(1, 6)];
rule.hour = 14;
rule.minute = 0;
Date.prototype.Format = function(fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}
function getToday(){
    return new Date().Format("yyyy-MM-dd");
}
var j = schedule.scheduleJob(rule, function(){
       User.find().then(function(user){   
           for(var i =0;i<user.length;i++){
               getCookie(user[i].username,user[i].password,user[i].token).then(function(a){
                for(var j =0;j<a.meinform.length;j++){
                    var mouth = /(.*)\/(.*)\/(.*)/;
                    var nowmouth = /(.*)-(.*)\-(.*)/;
                    var today = getToday().match(nowmouth);
                    var back = a.meinform[j].data.match(mouth);
                    if(today[1] == back[1]&& today[2] == back[2]){
                       if(back[3] - today[3]<=3){
                           if(a.token)
                           {var Url = 'https://zypc.xupt.edu.cn/oauth/wxsendtpl?access_token='+a.token;
                           superagent
                           .post(Url)
                           .send({
                               "template_id":"eLnTu-lNd9HJINhARIyWR6BEvq5mBWTqVeywkmcIip8",
                               "url":"http://newlib.xupt.org/user/inform",
                               "data":{ 
                                   "first":{value:"再不还书就没钱吃包子了",
                                   color:'blue'},
                                   keyword1:{
                                       value:a.meinform[j].bookname,
                                   },
                                   keyword2:{
                                    value:a.meinform[j].data,color:"red"
                                   } 
                               }
                           })
                           .end(function(err,res){
                           }
                           )
                        }
                       }
                    }
                }
            
            })
           }
       })
})

mongoose.connect('mongodb://localhost:27018/book',function(err){
    if(err){
        console.log('数据库连接失败');
    }
    else{
        console.log('连接成功');
    }
})

app.listen(8000);
