var settings = require('../settings');
var  Db = require('mongodb').Db;
var  Connection = require('mongodb').Connection;
var Server = require('mongodb').Server;

//设置数据库名、地址和端口，创建了一个数据库连接实例
//通过exports导出实例
//这样，我们就可以通过require这个文件来对数据库进行读/写了。

module.exports = new Db(settings.db,new Server(settings.host, settings.port), {safe: true});
