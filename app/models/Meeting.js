const mongoose = require('mongoose')
const Schema = mongoose.Schema
const time = require('../libs/timeLib')


const Meeting = new Schema({
    userId:{
        default:'',type:String
    },
    userEmail:{
        type:String
    },
    meetingId: {
        default:'',unique:true,type: String
    },
    title: {
        default:'',type: String
    },
    location:{
        type:String,default:''
    },
    purpose:{
        type:String,default:''
    },
    start:{
        type:Date,default:time.now()
    },
    end:{
        type:Date,default:time.now()
    },
    color:{
        primary:{type:String},
        secondary:{type:String}
    },    
    createdBy:{
        type:String,default:'admin'
    },
    createdOn:{
        type:Date,default:time.now()
    },
    modifiedOn:{
        type:Date,default:time.now()
    }
  })    
  
  module.exports = mongoose.model('Meeting', Meeting)