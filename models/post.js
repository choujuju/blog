var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(post) {
  this.name = post.name;
  this.head = post.head;
  this.title = post.title;
  this.tags = post.tags;
  this.post = post.post;
};

module.exports = Post;

Post.prototype.save = function(callback) {
  var date = new Date();
  var time = {
    date: date,
    year: date.getFullYear(),
    month: date.getFullYear() + "-" + (date.getMonth() + 1),
    day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
    minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() <10?'0'+date.getMinutes() : date.getMinutes())
  };

  var post = {
    name: this.name,
    head: this.head,
    title: this.title,
    tags: this.tags,
    post: this.post,
    time: time,
    comments: [],
    reprint_info: {},
    pv: 0
  };
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取Posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //将用户数据插入posts集合
      collection.insert(post, {
        safe:true
      }, function(err,post) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, post);//成功！err为空，并返回存储后的用户文档
      });
    });
  });
};

//读取文章及相关信息
Post.getTen = function(name,page,callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {

        mongodb.close();
        return callback(err);//错误，返回err信息
      }

      if (name) {
        //根据query对象查找文章

        collection.count({"name":name},function(err, total){
          collection.find({"name":name},{
            skip: (page-1)*10,
            limit: 10
          }).sort({
            time: -1
          }).toArray( function(err,docs) {
            mongodb.close();
            if (err) {

              return callback(err);
            }
            //解析markdown为html
            //用markdown格式编辑的博客内容可以渲染为HTML格式
            docs.forEach(function (doc) {
              doc.post = markdown.toHTML(doc.post);
            });

            callback(null, docs,total);//成功！返回查询的用户信息
          });
        });
      }
      else {
        return callback(null,null,0);
      }
    });
  });
};

Post.getOne = function(name, day, title, callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //根据query对象查找文章
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function(err,doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        if (doc) {
          //每访问一次，pv值就加1,对统一用户的多次浏览无效
          collection.update({
            "name": name,
            "time.day": day,
            "title": title
          },{
            $inc: {"pv": 1}
          },function(err) {
            mongodb.close();
            if (err) {
              return callback(err);
            }
          });
          doc.post = markdown.toHTML(doc.post);
          doc.comments.forEach(function(comment) {
            comment.content = markdown.toHTML(comment.content);
          });
          callback(null,doc);
        }
      });
    });
  });
};

Post.edit = function(name, day, title, callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取Posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //根据query对象查找文章
      collection.findOne({
        "name": name,
        "time.day": day,
        "title": title
      }, function(err,doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        //解析markdown为html
        callback(null,doc);
      });
    });
  });
};

Post.update = function(post, callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取Posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //更新数据库
      collection.update({
        "name": post.name,
        "time.day": post.day,
        "title": post.title
      }, {
        $set: {post: post.post}
      },function(err,doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        //解析markdown为html
        callback(null,doc);
      });
    });
  });
};

Post.remove = function(name,day,title,callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取Posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //更新数据库
      collection.remove({
        "name": name,
        "time.day": day,
        "title": title
      }, {
        w:1
      },function(err,doc) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        //解析markdown为html
        callback(null,doc);
      });
    });
  });
};

Post.getArchive = function(callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //返回只包含name，time，title属性的文档组成的存档数组
      collection.find({},{
        "name": 1,
        "time": 1,
        "title": 1
      }).sort({
        time:-1
      }).toArray(function(err,docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null,docs);
      });
    });
  });
};

Post.getTags = function(callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //distinct用来找出给定键的所有不同值
      collection.distinct("tags",function(err,docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null,docs);
      });
    });
  });
};

Post.getTag = function(tag, callback) {
  //打开数据库
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //查询所有tags数组内包含tag的文档
      //并返回只含有name、time、title组成的数组
      collection.find({"tags":tag},{
        "name":1,
        "time":1,
        "title":1
      }).sort({
        time: -1
      }).toArray( function(err,docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null, docs);//成功！返回查询的用户信息
      });
    });
  });
};

Post.search = function (keyword,callback) {
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);
    }
    db.collection('posts',function (err,collection) {
      if (err) {
        mongodb.close();
        return callback(err);
      }
      var pattern = new RegExp(keyword, "i");
      collection.find({
        "title":pattern
      },{
        "name":1,
        "time":1,
        "title":1
      }).sort({
        time:-1
      }).toArray(function (err, docs) {
        mongodb.close();
        if (err) {
          return callback(err);
        }
        callback(null,docs);
      });
    });
  });
};

Post.reprint = function(reprint_from,reprint_to,callback) {
  mongodb.open(function(err,db) {
    if (err) {
      return callback(err);//错误，返回err信息
    }
    //读取Posts集合
    db.collection('posts', function (err, collection) {
      if (err) {
        mongodb.close();
        return callback(err);//错误，返回err信息
      }
      //将用户数据插入posts集合
      collection.findOne({
        "name":reprint_from.name,
        "time.day": reprint_from.day,
        "title": reprint_from.title
      }, function(err,doc) {
        if (err) {
          mongodb.close();
          return callback(err);
        }
        var date = new Date();
        var time = {
          date: date,
          year: date.getFullYear(),
          month: date.getFullYear() + "-" + (date.getMonth() + 1),
          day: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate(),
          minute: date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() <10?'0'+date.getMinutes() : date.getMinutes())
        };
        delete doc._id;

        doc.name = reprint_to.name;
        doc.head = reprint_to.head;
        doc.time = time;
        doc.title = (doc.title.search(/[转载]/)>-1)?doc.title:"[转载]"+doc.title;
        doc.reprint_info = {"reprint_from":reprint_from};
        doc.pv = 0;

        collection.update({
          "name":doc.name,
          "time.day": reprint_from.day,
          "title": reprint_from.title
        },{
          $push:{
            "reprint_info.reprint_to": {
              "name":doc.name,
              "day":time.day,
              "title":doc.title
            }
          }
        },function(err) {
          if (err) {
            mongodb.close();
            return callback(err);
          }
        });
        //将生成的副本修改后存入数据库，并返回存储后的文档
        collection.insert(doc,{
          safe:true
        },function (err,post) {
          mongodb.close();
          if (err) {
            return callback(err);
          }
          callback(null, post.ops[0]);//成功！err为空，并返回存储后的用户文档
        });
      });
    });
  });
};
