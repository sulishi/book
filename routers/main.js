var express = require('express');
var charset = require('superagent-charset');
var superagent = charset(require('superagent'));
var cheerio = require('cheerio');
var urlencode = require('urlencode');
var router = express.Router();

//处理爬虫数据

router.get('/search',function(req,res,next){
    var book = req.query.book;
    var page = req.query.page || 1;
    getinform(book,page,1).then(function(inform){
        var a = '您要找的书籍信息不存在'
        if(inform == '')
        {
            res.render('main/search',{a:a,
            url:'/main/search',last:'/'})
        }
        else{ 
            var limit = 20;
           
            pages=Math.ceil(inform.number/limit),
            page = Math.min(page,pages);
            page = Math.max(page,1);
        res.render('main/search',{inform:inform,
                    url:'/main/search',
                    page:page,
                    pages:pages,
                    book:book
            })
        }
    }),function(err){
        res.send('出错了')
    }
});
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
                var regbookname = /(.*),/;
                var author;
               b = $(this).find('td').eq(2).text();
               if(regbookname.test(b))
               {
                   author = b.match(regbookname)[1]
               }
               else{
                   author = $(this).find('td').eq(2).text()
               }
               var book= {
                   bookname:$(this).find('td').eq(1).text(),
                    author:author,
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
                var miji = /[1-9]/;
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
                else if(miji.test(book.search)){
                    book.where = '密集书库'
                }
                inform.push(book);
                
            });
            resolve(inform);
        }
    })
})
}
module.exports=router;