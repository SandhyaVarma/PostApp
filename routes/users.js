var mongoose= require('mongoose')
var plm = require('passport-local-mongoose')

mongoose.connect('mongodb://localhost/facebook')

var userSchema = mongoose.Schema({
  name:String,
  username:String,
  password:String,
  email:String,
  profilepic:{type:Array,default:'defaultprofile.jpg'},
  posts:[{ type:mongoose.Schema.Types.ObjectId, ref:"post"}],
  secret:{
    type:String,
  },
  expiry:{
    type:Date
  }

})

userSchema.plugin(plm)

module.exports = mongoose.model('user', userSchema)