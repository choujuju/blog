//加载express、path等模块
var express = require('express');
var path = require('path');
var debug = require('debug')('blog:server');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session  = require('express-session');
var bson = require('bson');
var MongoStore = require('connect-mongo')(session);
var multer = require('multer');
//加载routes文件夹下的index.js和users.js路由文件
var routes = require('./routes/index');
var settings = require('./settings');
var flash = require('connect-flash');
//var users = require('./routes/users');

//生成一个express实例app
var app = express();
var passport = require('passport'),
    GithubStrategy = require('passport-github').Strategy;
//创建输入输出流
var fs = require('fs');
var accessLog = fs.createWriteStream('access.log',{flags:'a'});
var errorLog = fs.createWriteStream('error.log',{flags:'a'});
// view engine setup
//设置views文件夹为存放视图文件的目录，即存放模板文件的地方：__dirname为全局变量，存储当前正在执行的脚本所在的目录。
app.set('views', path.join(__dirname, 'views'));
//设置视图模板引擎为 ejs
app.set('view engine', 'ejs');

app.use(flash());

// uncomment after placing your favicon in /public
//设置/public/favicon.ico为favicon图标
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
//加载日志中间件。
app.use(logger('dev'));
//将日志保存为日志文件
app.use(logger({stream:accessLog}));
//加载解析json的中间件
app.use(bodyParser.json());
//加载解析urlencoded请求体的中间件
app.use(bodyParser.urlencoded({ extended: true }));
//加载解析cookie的中间件
app.use(cookieParser());
//设置public文件夹为存放静态文件的目录
app.use(express.static(path.join(__dirname, 'public')));
//将日志写到文件中
app.use(function (err,req,res,next) {
  var meta = '['+new Date()+']'+req.url+'/n';
  errorLog.write(meta + err.stack +'/n');
  next();
});

//路由控制器
//app.use('/', routes);       //查看routes/index.js文件，该文件导出了一个router实例
//app.use('/users', users);   //

//调用index.js导出的函数


//app.listen(app.get('port'),function() {
//  console.log('Express server listing on port '+ app.get('port'));
//});
//使用express-session和connect-mongo模块实现了将会话信息存储到MongoDB中。
//secret用来防止篡改Cookie
app.use(passport.initialize());//初始化Passport

app.use(session({
    secret: settings.cookieSecret,
    key: settings.db,
    cookie: {maxAge:1000*60*60*24*30},//30 days
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({ //将会话信息存储到数据库中
      db:settings.db,
      host:settings.host,
      port:settings.port
    })
  }));
routes(app);
/*
var sessionStore = new MongoStore({ //将会话信息存储到数据库中
  db:settings.db,
  host:settings.host,
  port:settings.port
},function(e) {
  app.use(session({
      secret: settings.cookieSecret,
      key: settings.db,
      cookie: {maxAge:1000*60*60*24*30},//30 days
      store: sessionStore
  }));
  app.set('port', process.env.PORT || '3000');
  app.listen(app.get('port'));
});
*/
app.use(multer({
  //dest:上传文件所在的路径
  dest: './public/images',
  //修改文件名（此处为保持文件名）
  rename: function(fieldname,filename) {
    return filename;
  }
}));
// catch 404 and forward to error handler
//捕获404错误，并转发到错误处理器
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

passport.use(new GithubStrategy({
  clientID:"3035f36ec15df46c6596",
  clientSecret:"ea356ea0b38a2370ca1eedd7b1876d035bb8f658",
  callbackURL:"http://10.8.190.181:3000/login/github/callback"
},function(accessToken,refreshToken,profile,done){
  done(null,profile);
}));

// error handlers

// development error handler
// will print stacktrace
//开发环境下的错误处理器，将错误信息渲染error模板并显示到浏览器中
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
//生产环境下的错误处理器，将错误信息渲染error模板并显示到浏览器中
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.set('port', process.env.PORT || '3000');
app.listen(app.get('port'));

//导出app实例供其它模块调用
module.exports = app;
