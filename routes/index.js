var express = require('express');
const passport = require('passport');
var router = express.Router();
var userModel = require('./users')
const postModel= require('./post')
const commentmodel = require('./comment')
var localStrategy = require('passport-local')
const multer = require('multer')
const sendMail= require('./nodemailer')
const { v4: uuidv4 } = require('uuid');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null,uniqueSuffix + '-' + file.originalname )
  }
})

const upload = multer({ storage: storage })

passport.use(new localStrategy(userModel.authenticate()))


router.get('/',checkLoggedIn, function(req,res){
  res.render('index')
})

router.get('/signup', function(req,res){
  res.render('signup')
})

router.get('/signin', function(req,res){
  res.render('index')
})

router.get('/create', function(req,res){
  res.render('create')
})

router.post('/uploadpic',isLoggedIn, upload.single('image'),function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    foundUser.profilepic.push(req.file.filename) 
    foundUser.save()
    .then(function(){
      res.redirect('/profile')
  })
  })
})

router.get('/showprofilepic',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    res.render('show', {foundUser})
  })
})

router.get('/setpic/:index',isLoggedIn,function(req,res){
   userModel.findOne({username:req.session.passport.user})
     .then(function(foundUser){
       foundUser.profilepic.push(foundUser.profilepic[req.params.index])
       foundUser.profilepic.splice(req.params.index,1)
       foundUser.save()
       .then(function(){
         res.redirect('/profile')
       })
 })
})

router.post('/register', function(req,res){
  var newUser = new userModel({
    name: req.body.name,
    username: req.body.username,
    email:req.body.email
  })
  userModel.register(newUser, req.body.password)
  .then(function(u){
    passport.authenticate('local')(req,res, function() {
      res.redirect('/timeline')
    })
  })
  .catch(function(err){
    res.send(err)
  })
})

router.post('/login',passport.authenticate('local' , {
  successRedirect:'/timeline',
  failureRedirect:'/'
}), function (req,res,next){})

router.get('/profile',isLoggedIn, function (req,res){
  userModel.findOne({username:req.session.passport.user})
  .populate('posts')
  .then(function (userDets){
    postModel.find()
    .then(function(foundpost){
        res.render('profile',{userDets:userDets ,foundpost}) 
    })
  }) 
})

router.post('/createpost',isLoggedIn, function (req,res){
  userModel.findOne({username:req.session.passport.user})
   .then(function(foundUser) {
    postModel.create({
      imageurl:req.body.imageurl,
      caption:req.body.caption,
      postuser: foundUser._id
    }).then(function (createdPost) {
      foundUser.posts.push(createdPost)
      foundUser.save()
      .then(function(created){
          res.redirect('/profile')   
      })
    })   
   })  
})

router.get('/delete/:id',isLoggedIn,function(req,res){
  postModel.findOneAndDelete({_id:req.params.id})
  .then(function(deleted){
    res.redirect('/profile')
  })
})

router.get('/edit/:id',isLoggedIn,function(req,res){
  postModel.findOne({_id:req.params.id})
  .then(function(post){
    res.render('update',{post})
  })
})

router.post('/updatepost/:id',function(req,res){
  var data={
    imageurl:req.body.imageurl,
    caption:req.body.caption,
  }
  postModel.findOneAndUpdate({_id:req.params.id},data)
  .then(function(updated){
    res.redirect('/profile')
  })
})

router.get('/timeline',isLoggedIn, function (req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function (userDets){
    postModel.find()
    .populate('postuser')
    .populate({path:'comments',
               populate:{path:'writer'}})
    .then(function(allpost){
       res.render('post',{userDets,allpost}) 
    })
  }) 
})

router.post('/comment/:postid',function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id:req.params.postid})
    .then(function(post){
      commentmodel.create({
        comment:req.body.comment,
        post:post,
        writer:foundUser
      })
      .then(function(commented){
        post.comments.push(commented)
        post.save()
        .then(function(){
          res.redirect('/timeline')
        })
      })
    })
  })
})

router.get('/likecmnt/:id',isLoggedIn,function(req,res){
   userModel.findOne({username:req.session.passport.user})
   .then(function(foundUser){
      commentmodel.findOne({_id:req.params.id})
      .then(function(comment){
        if(comment.likes.indexOf(foundUser._id)=== -1){
           comment.likes.push(foundUser._id)
        } 
        else{
         var index = comment.likes.indexOf(foundUser._id)
         comment.likes.splice(index,1)
        }
        comment.save()
        .then(function(){
          res.redirect(req.headers.referer)
        })
    })
   })
})

router.get('/allcmnt/:id',isLoggedIn,function(req,res){
 userModel.findOne({username:req.session.passport.user})
 .then(function(userDets){
  postModel.findOne({_id:req.params.id})
  .populate('postuser')
    .populate({path:'comments',
               populate:{path:'writer'}})
  .then(function(post){
    commentmodel.find()
    .then(function(comment){
      res.render('comment',{userDets,post,comment})
    })
  })
 })
})

router.get('/timeline/:page',isLoggedIn, function (req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function (userDets){
    postModel.find()
    .skip(2*(req.params.page -1))
    .limit(5)
    .populate('postuser')
    .then(function(user){
        res.render('post',{userDets:userDets,user }) 
    })
  }) 
})

router.get('/like/:id',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id:req.params.id})
    .then(function(post){
      if(post.like.indexOf(foundUser._id ) === -1){
        post.like.push(foundUser._id)
      } else{
        var index = post.like.indexOf(foundUser._id)
        post.like.splice(index,1)
      }
      post.save()
      .then(function(){
        res.redirect(req.headers.referer)
      })
    })
  })
})

router.get('/follow/:id',isLoggedIn,function(req,res){
  userModel.findOne({username:req.session.passport.user})
  .then(function(foundUser){
    postModel.findOne({_id:req.params.id})
    .then(function(post){
      if(post.follow.indexOf(foundUser._id ) === -1){
        post.follow.push(foundUser._id)
      } else{
        var index = post.like.indexOf(foundUser._id)
        post.follow.splice(index,1)
      }
      post.save()
      .then(function(){
        res.redirect(req.headers.referer)
      })
    })
  })
})

router.get('/reset',function(req,res){
  res.render('email')
})

router.post('/reset',function(req,res){
  const secretkey = uuidv4()
  userModel.findOne({email:req.body.email})
  .then(function(foundUser){
    if(foundUser !== null){
      foundUser.secret = secretkey
      foundUser.expiry = Date.now()+5*60*1000
      foundUser.save()
      .then(function(){
        var routeraddress = `http://localhost:3000/reset/${foundUser._id}/${secretkey}`
        sendMail( req.body.email,routeraddress)
        .then(function(){
          res.send('sent!')
        })
      })
    }
    else{
     res.send('This account does not exists')
    }
   
   
  })
})

router.get('/reset/:id/:secret',function(req,res){
  userModel.findOne({_id:req.params.id})
  .then(function(foundUser){
    if(foundUser.secret === req.params.secret && foundUser.expiry> Date.now()){
      res.render('newpassword',{foundUser})
    }
  })
})

router.post('/newpassword/:id',function(req,res){
  userModel.findOne({_id:req.params.id})
  .then(function(foundUser){
    if(req.body.password1 === req.body.password2){
      foundUser.setPassword(req.body.password1,function(err,updated){
        foundUser.save()
        .then(function(){
          req.logIn(foundUser,function(err){
            res.redirect('/timeline')
          })
        })
      })
    }
  })
})


router.get('/logout',function (req,res){
  req.logOut()
  res.redirect('/')
})

function isLoggedIn(req,res,next){
  if(req.isAuthenticated()){
    return next()
  }
else{
  res.redirect('/')
}
}

function checkLoggedIn(req,res,next){
  if(req.isAuthenticated()){
  res.redirect('/timeline')
    
  }
else{
  return next()
}
}

module.exports = router;
