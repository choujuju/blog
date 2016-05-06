/*这个路由模块实际上可以和app.js文件写到一起，这样就不用导入导出了。
 *但是通常一个网站含有多个网页，可以通过get函数的第一个参数指定的路径来调用不同的相应函数
 *这样可以保持app.js代码的简洁性，代码模块化思想。
 *
 *通常我们路由控制器和实现路由的函数都放在index.js中，在app.js中只有一个总的路由接口
 */

/*
  //加载express模块
  var express = require('express');
  //生成一个路由实例
  var router = express.Router();

  //GET home page.
  //用路由实例来捕获访问主页的GET请求，
  //导出这个路由并在app.js中通过app.use('/',routes)；加载。
  //这样，当访问主页时，就会调用res.render('index', {title:'Express'});
  //渲染views/index.ejs模板并显示到浏览器中。
  router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
  });
  //导出router实例供其它模块调用
  module.exports = router;
*/

//修改之后的代码如下：
//引入核心模块crypto生成散列值来加密密码
var crypto = require('crypto'),
//引入User进行数据库操作
    User = require('../models/user.js');
    Post = require('../models/post.js');
    Comment = require('../models/comment.js');
    passport = require('passport');

module.exports = function(app) {
  app.get('/', function(req, res) {
    var page=req.query.p ? parseInt(req.query.p) : 1;
    if(req.session.user) {
      name=req.session.user.name;
    }
    else {
      name=null;
    }
    Post.getTen(name,page,function(err,posts,total) {
      if (err) {
        posts = [];
      }
      //res.render()函数渲染模板，
      //第一个参数：指定模板
      //第二个参数：传递给模板的数据对象，用于模板翻译。

      res.render('index', {
        title: '主页',
        user: name,
        posts: posts,
        page: page,
        isFirstPage: (page-1) == 0,
        isLastPage: ((page-1)*10+posts.length) == total,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.get('/login', checkNotLogin);
  app.get('/login', function(req, res) {
    res.render('login', {
      title: '登陆',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
   });
  });
  app.get('/login/github',passport.authenticate("github",{session:false}));
  app.get('/login/github/callback',passport.authenticate("github",{
    session:false,
    failureRedirect:'/login',
    successFalsh:'登陆成功！'
  }),function(req,res){
    req.session.user = {name: req.user.username, head: "https://gravatar.com/avatar/"+req.user._json.gravatar_id+"?s=48"};
    res.redirect('/');
  });
  app.post('/login', checkNotLogin);
  app.post('/login', function(req,res) {
    //生成密码的md5值
    var md5=crypto.createHash('md5'),
        password=md5.update(req.body.password).digest('hex');
    //检查用户名是否存在
    User.get(req.body.name, function (err, user) {
      if (!user) {
        req.flash('error','用户不存在！');
        return res.redirect('/login');
      }
      if(user.password != password) {
        req.flash('error','密码错误！');
        return res.redirect('/login');
      }
      req.session.user=user;
      req.flash('success','登陆成功！');
      res.redirect('/');
    });
  });
  app.get('/reg', checkNotLogin);
  app.get('/reg', function(req, res) {
    res.render('reg', {
      title: '注册',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/reg', checkNotLogin);
  app.post('/reg', function(req, res) {
    var name = req.body.name,
        password = req.body.password,
        password_re = req.body['password-repeat'];
    //检测用户两次输入的密码是否一致
    if (password != password_re) {
      req.flash('error','两次输入的密码不一致！');
      return res.redirect('/reg');//返回注册页
    }
    //生成密码的md5值
    var md5 = crypto.createHash('md5'),
        password = md5.update(req.body.password).digest('hex');
    var newUser = new User({
      name: req.body.name,
      password: password,
      email: req.body.email
    });
    //检查用户名是否已经存在
    User.get(newUser.name, function (err, user) {
      if (err) {
        req.flash('error',err);
        return res.redirect('/')
      }
      if (user) {
        req.flash('error','用户已经存在');
        return res.redirect('/reg');//返回注册页
      }
      //如果不存在则新增用户
      newUser.save(function(err,user) {
        if(err) {
          req.flash('error',err);
          return res.redirect('/reg');
        }
        req.session.user = user;//用户信息存入session
        req.flash('success', '注册成功！');
        res.redirect('/');//注册成功后返回主页
      });
    });
  });
  app.get('/post', checkLogin);
  app.get('/post', function(req, res) {
    res.render('post', {
      title: '发表',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
   });
  });
  app.post('/post', checkLogin);
  app.post('/post', function(req, res) {
    var currentUser = req.session.user,
        tags = [req.body.tag1,req.body.tag2,req.body.tag3],
        post = new Post({
          name: currentUser.name,
          head: currentUser.head,
          title: req.body.title,
          tags: tags,
          post: req.body.post
        });
    post.save(function (err) {
      if (err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      req.flash('success','发布成功！');
      res.redirect('/');
    });
  });
  app.get('/logout', checkLogin);
  app.get('/logout', function(req, res) {
    req.session.user=null;
    req.flash('success','登出成功！');
    res.redirect('/');
  });
  app.get('/upload', checkLogin);
  app.get('/upload', function(req, res) {
    res.render('upload',{
      title: '文件上传',
      user: req.session.user,
      success: req.flash('success').toString(),
      error: req.flash('error').toString()
    });
  });
  app.post('/upload', checkLogin);
  app.post('/upload', function(req, res) {
    req.flash('success','文件上传成功！');
    res.redirect('/upload');
  });
  app.get('/archive', checkLogin);
  app.get('/archive', function(req, res) {
    Post.getArchive(function(err,posts) {
      if (err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('archive',{
        title: '存档',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.get('/u/:name', checkLogin);
  app.get('/u/:name', function(req, res) {
    var page=req.query.p ? parseInt(req.query.p) : 1;
    //检查用户是否存在

    User.get(req.params.name, function (err,user) {

      if (!user) {
        req.flash('error','用户不存在！');
        return res.redirect('/');
      }
      //查询并返回该用户的所有文章
      Post.getTen(user.name,page, function (err, posts, total) {
        if(err) {
          req.flash('error',err);
          return res.redirect('/');
        }
        res.render('user',{
          title: user.name,
          posts: posts,
          user: req.session.user,
          page: page,
          isFirstPage: (page-1) == 0,
          isLastPage: ((page-1)*10+posts.length) == total,
          success: req.flash('success').toString(),
          error: req.flash('error').toString()
        });
      });
    });
  });
  app.get('/links', function(req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      res.render('links',{
        title: "友情链接",
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.get('/search', checkLogin);
  app.get('/search', function(req, res) {
    Post.search(req.query.keyword, function (err, posts) {
      if (err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('search',{
        title: "SEARCH"+req.query.keyword,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  //app.get('/u/:name/:day/:title', checkLogin);
  app.get('/u/:name/:day/:title', function(req, res) {
    Post.getOne(req.params.name, req.params.day,req.params.title, function (err, post) {
      if (err) {
        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('article',{
        title: req.params.title,
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.post('/u/:name/:day/:title', checkLogin);
  app.post('/u/:name/:day/:title', function(req, res) {
    var date = new Date(),
        time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() <10?'0'+date.getMinutes() : date.getMinutes());
    var md5 = crypto.createHash('md5'),
        email_MD5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
        head = "http://www.gravatar.com/avatar/" + email_MD5 + "?s=48";
    var comment = {
          name: req.body.name,
          head: head,
          email: req.body.email,
          website: req.body.website,
          time: time,
          content: req.body.content
        };
    var newComment=new Comment(req.params.name, req.params.day,req.params.title,comment);
    newComment.save(function(err) {
      if (err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      req.flash('success','留言成功！');
      res.redirect('back');
    });
  });
  app.get('/edit/:name/:day/:title', checkLogin);
  app.get('/edit/:name/:day/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.edit(currentUser.name, req.params.day,req.params.title, function (err, post) {
      if (err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      res.render('edit',{
        title: '编辑',
        post: post,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.post('/edit/:name/:day/:title', checkLogin);
  app.post('/edit/:name/:day/:title', function(req, res) {
    var currentUser = req.session.user,
        p = {
          name: currentUser.name,
          day: req.params.day,
          title: req.params.title,
          post: req.body.post
        };
    Post.update(p,function (err) {
      var url = encodeURI('/u/'+req.params.name+'/'+req.params.day+'/'+req.params.title);
      if (err) {
        req.flash('error',err);
        return res.redirect(url);
      }
      req.flash('success','修改成功！');
      res.redirect(url);
    });
  });
  app.get('/remove/:name/:day/:title', checkLogin);
  app.get('/remove/:name/:day/:title', function(req, res) {
    var currentUser = req.session.user;
    Post.remove(currentUser, req.params.day,req.params.title, function (err) {
      if (err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      req.flash('success','删除成功！');
      res.redirect('/');
    });
  });
  app.get('/reprint/:name/:day/:title', checkLogin);
  app.get('/reprint/:name/:day/:title', function(req, res) {
    Post.edit(req.params.name, req.params.day, req.params.title, function (err, post) {

      if (err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      var currentUser = req.session.user,
          reprint_from = {name: post.name,day:post.time.day,title:post.title},
          reprint_to = {name: currentUser.name,head:currentUser.head};
      Post.reprint(reprint_from,reprint_to,function(err,post) {
        if (err) {
          req.flash('error',err);
          return res.redirect('back');
        }
        req.flash('success',"转载成功！");
        var url = encodeURI('/u/'+post.name+'/'+post.time.day+'/'+post.title);
        res.redirect(url);
      });
    });
  });
  app.get('/tags', checkLogin);
  app.get('/tags', function(req, res) {
    Post.getTags(function(err,posts) {
      if (err) {
        req.flash('error',err);
        return res.redirect('back');
      }
      res.render('tags',{
        title: '标签',
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.get('/tags/:tag', checkLogin);
  app.get('/tags/:tag', function(req, res) {
    Post.getTag(req.params.tag,function(err,posts) {
      if (err) {

        req.flash('error',err);
        return res.redirect('/');
      }
      res.render('tag',{
        title: '标签：' + req.params.tag,
        posts: posts,
        user: req.session.user,
        success: req.flash('success').toString(),
        error: req.flash('error').toString()
      });
    });
  });
  app.use(function(req,res) {
    res.render("404");
  });

  function checkLogin(req,res,next) {
    if (!req.session.user) {
      req.flash('error','未登录！');
      res.redirect('/login');
    }
    next();
  }

  function checkNotLogin(req,res,next) {
    if (req.session.user) {
      req.flash('error','已登录！');
      res.redirect('back');
    }
    next();
  }
};
