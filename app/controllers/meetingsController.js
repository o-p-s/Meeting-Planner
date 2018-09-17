/** DEPENDENCIES */
const mongoose = require('mongoose');
/** LIBRARIES */
const response = require('../libs/responseLib'),logger = require('../libs/loggerLib'), check = require('../libs/checkLib')
/**MODELS */
const MeetingModel= mongoose.model('Meeting');

let getUserMeetings=(req,res)=>{
    if(!check.isEmpty(req.query.userId)){
        MeetingModel.find({userId:req.query.userId})
        .select('-_id -__v -createdOn -modifiedOn')
        .lean()
        .exec((err,result)=>{
            if(err){
                logger.error(err+'db error occurred','meetingController:getUserMeetings()',1)            
                res.status(500).send(response.generate(false,' databse error occurred',500,null))
            }
            else if(check.isEmpty(result)){
                logger.error('No Meetings found','meetingController:getUserMeetings()',1)
                res.status(404).send(response.generate(false,'No Meetings found',404,null))
            }
            else {
                logger.info('success','Meetings were sent',1);  
                res.status(200).send(response.generate(false,'Meetings found',200,result))
            }
        })
    }else{
        logger.error('Invalid Request Parameters','meetingController:getUserMeetings()',1)
        res.status(400).send(response.generate(false,'Invalid Request Parameters',400,null))
    }
}
module.exports={
    getUserMeetings:getUserMeetings,
}