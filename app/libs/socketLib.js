/** DEPENDENCIES */
const socketio = require('socket.io'),mongoose = require('mongoose'), shortid = require('shortid'),
events = require('events'), eventEmitter = new events.EventEmitter();
/** CONFIGS */
const mailerConfig=require('./../../config/mailerConfig');
/** LIBRARIES */
const tokenLib = require("./tokenLib.js"),check = require("./checkLib.js"),redisLib =require('./redisLib.js'),
mailerLib=require('./../libs/mailerLib'),logger = require('./loggerLib.js');
/** MODELS */
const MeetingModel= mongoose.model('Meeting'),UserModel = mongoose.model('User');

let smtpTransport = mailerLib.smtpTransport;
let timeouts=[];
let setServer = (server) => {

    let io = socketio.listen(server);

    let myIo = io.of('')

    myIo.on('connection',(socket) => {

        console.log("\n------------------------------------SOCKET CONNECTION OPEN---------------------------------------------");
        
        /**
         * USER RELATED SOCKETS
         */
        socket.on('set-user',(authToken) => {console.log('callling');
            tokenLib.verifyClaimWithoutSecret(authToken,(err,user)=>{
                if(err){console.log('callling in tokeen verify');
                    socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' })
                }
                else{
                    console.log("\n User has been verified..  setting details\n");
                    function checkInAllUsersList(currentUser){
                            redisLib.getFromHash('AllUsersList',currentUser.userId,(err,registeredUser)=>{
                                if(err)
                                    logger.error('Error in searching AllUsersList','socketLib:set-user:checkInAllUsersList',3)
                                else if(check.isEmpty(registeredUser)){
                                    logger.info('Record not found in allUsers','socketLib:set-user:checkInAllUsersList',3)
                                    redisLib.setInHash('AllUsersList',currentUser.userId,JSON.stringify({name:currentUser.fullName,email:currentUser.email}),(err,newRegisteredUsers)=>{
                                        if(err)
                                        logger.error('Some Error Occurred in setting newAllUsersList','socketLib:set-user:checkInAllUsersList',3)
                                        else if(check.isEmpty(newRegisteredUsers))
                                        logger.error('Empty new allRegisteredUsers found','socketLib:set-user:checkInAllUsersList',3)                                   
                                        else
                                        logger.info('Record was successfully set in allRegisteredUsers','socketLib:set-user:checkInAllUsersList',3)
                                    })
                                }else
                                    logger.info('Record was found in allRegisteredUsers','socketLib:set-user:checkInAllUsersList',3) 
                            })
                    }
                    let currentUser = user.data;                    
                    socket.userId = currentUser.userId;            
                    currentUser['fullName']=`${currentUser.firstName} ${currentUser.lastName}`;
                    checkInAllUsersList(currentUser);
                }            
            })
        }) // end of listening set-user event
        /**
         * @apiGroup Listener
         * @apiVersion  1.0.0
         * @api {on} "set-user"  Sets  User
         * @apiDescription Verifies authenticated token, sets user in AllUsersList if a new registeration.
         * 
         * @apiParam {string} authToken token for verification. (required)
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiSuccessExample {object} Success-Response:
            [
                { 'TO-3dL3cE': '{"name":"Trial User","email":"trail00@gmail.com"}' }
            ]
        */
        socket.on('disconnect', () => {  

        }) // end of on disconnect

        socket.on('get-users',(skip)=>{
            redisLib.getAllInAHash('AllUsersList',(err,result)=>{
                if(err){
                    logger.error('error occurred in getting all users list','socketLib:get-users',3)
                    result['status']=500;
                }
                else if(result){
                    logger.info('All Users List fetched from hashes','socketLib:get-users',3);
                    let res={},i=0;
                    for (let u in result) {
                        if (result.hasOwnProperty(u) && i<skip+5) {
                            if(i==skip){
                                res[u] = result[u];                                
                            }
                            i++;
                        }else
                        break;
                    }
                    socket.emit('all-users-list',res);
                }
            })            
        })
        /**
         * @apiGroup Listener
         * @apiVersion  1.0.0
         * @api {on} "get-users" All Users List
         * @apiDescription Fetches and emits the updated list of all registered users in the server
         * 
         * @apiParam {string} skip No. of users to skip per request. (required)
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiSuccessExample {object} Success-Response:
           [
                { 'TO-3dL3cE': '{"name":"Trial User","email":"trail00@gmail.com"}' 
                  'UZ49dL3cX': '{"name":"Trial User1","email":"trail01@gmail.com"}' 
                }
            ]
        */
         /**
         * @apiGroup Emitter
         * @apiVersion  1.0.0
         * @api {on} "all-users-list" All Users List
         * @apiDescription Emits the updated list of all registered users in the server
         * 
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiSuccessExample {object} Success-Response:
           [
                { 'TO-3dL3cE': '{"name":"Trial User","email":"trail00@gmail.com"}' 
                  'UZ49dL3cX': '{"name":"Trial User1","email":"trail01@gmail.com"}' 
                }
            ]
        */
        socket.on('verify-session',(data)=>{
            tokenLib.verifyClaimWithoutSecret(data,(err,user)=>{
                if(err){
                    socket.emit('auth-error', { status: 401, error: 'Auth Token Expired or Invalid' })
                }
            })
        });
        /**
         * @apiGroup Listener
         * @apiVersion  1.0.0
         * @api {on} "verify-session" Verify Session
         * @apiDescription Verifies a user's session using authToken in the server
         * 
         * @apiParam {string} authToken authtoken of the user. (required)
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiErrorExample Error-Response:
            HTTP/1.1  401  Unauthorized error
            {
               "status":401,
               "error": "Auth Token Expired or Invalid"
             }
        */
        /**
         * @apiGroup Emitter
         * @apiVersion  1.0.0
         * @api {on} "auth-error" Auth Error
         * @apiDescription Emits an error, if session verification of a user fails.
         * 
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * @apiErrorExample Error-Response:
            HTTP/1.1  401  Unauthorized error
            {
               "status":401,
               "error": "Auth Token Expired or Invalid"
             }
         */
        socket.on('save-event',(data)=>{
            if(data.meeting.meetingId==undefined || data.meeting.meetingId==null)
            data.meeting['meetingId']=shortid.generate();
            eventEmitter.emit('notify-user',(data));
            setTimeout(() => {
                eventEmitter.emit('save-meeting',(data));    
            }, 2000);
            socket.emit('save',data);
            myIo.emit(data.meeting.userId,data);
        });
        /**
         * @apiGroup Listener
         * @apiVersion  1.0.0
         * @api {on} "save-event" Save Meeting
         * @apiDescription Creates or updates a meeting & notifies user.
         * 
         * @apiParam {Json} data Required data of a meeting. (required)
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiSuccessExample {object} Success-Response:
           [
                { 
                    action: 'save',
                    meeting:{ 
                            title: 'Business Meeting',
                            location: 'Los Angles,52 Street',
                            purpose: 'New Project',
                            createdBy: 'op-admin@gmail.com S',
                            start: '2018-09-15T18:30:00.000Z',
                            end: '2018-09-16T18:29:59.999Z',
                            color: { primary: '#ad2121', secondary: '#FAE3E3' },
                            userId: 'TO-3dL3cE',
                            userEmail: 'trail00@gmail.com',
                            meetingId: 'BM3qepMEx' 
                        } 
                }
            ]
        */
        /**
         * @apiGroup Emitter
         * @apiVersion  1.0.0
         * @api {on} "save" All Users List
         * @apiDescription Emits the saved meeting in the server.
         * 
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiSuccessExample {object} Success-Response:
           [
                { 
                    action: 'save',
                    meeting:{ 
                            title: 'Business Meeting',
                            location: 'Los Angles,52 Street',
                            purpose: 'New Project',
                            createdBy: 'op-admin@gmail.com S',
                            start: '2018-09-15T18:30:00.000Z',
                            end: '2018-09-16T18:29:59.999Z',
                            color: { primary: '#ad2121', secondary: '#FAE3E3' },
                            userId: 'TO-3dL3cE',
                            userEmail: 'trail00@gmail.com',
                            meetingId: 'BM3qepMEx' 
                        } 
                }
            ]
        */
        socket.on('remove-event',(data)=>{
            setTimeout(() => {
                eventEmitter.emit('delete-meeting',(data));
            }, 2000);
            console.log(data);
            socket.emit('remove',data)
            myIo.emit(data.meeting.userId,data)
        });
        /**
         * @apiGroup Listener
         * @apiVersion  1.0.0
         * @api {on} "remove-event" Delete Meeting
         * @apiDescription Deletes a meeting based on meeting Id.
         * 
         * @apiParam {Json} data Required data to delete a meeting. (required)
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiSuccessExample {object} Success-Response:
           [
                { 
                    action: 'delete',
                    meeting:{ 
                            title: 'Business Meeting',
                            location: 'Los Angles,52 Street',
                            purpose: 'New Project',
                            createdBy: 'op-admin@gmail.com S',
                            start: '2018-09-15T18:30:00.000Z',
                            end: '2018-09-16T18:29:59.999Z',
                            color: { primary: '#ad2121', secondary: '#FAE3E3' },
                            userId: 'TO-3dL3cE',
                            userEmail: 'trail00@gmail.com',
                            meetingId: 'BM3qepMEx' 
                        } 
                }
            ]
        */
        /**
         * @apiGroup Emitter
         * @apiVersion  1.0.0
         * @api {on} "remove" All Users List
         * @apiDescription Emits the deleted meeting in the server.
         * 
         * @apiSuccess {object} myResponse shows error status, message, http status code, result.
         * 
         * @apiSuccessExample {object} Success-Response:
           [
                { 
                    action: 'delete',
                    meeting:{ 
                            title: 'Business Meeting',
                            location: 'Los Angles,52 Street',
                            purpose: 'New Project',
                            createdBy: 'op-admin@gmail.com S',
                            start: '2018-09-15T18:30:00.000Z',
                            end: '2018-09-16T18:29:59.999Z',
                            color: { primary: '#ad2121', secondary: '#FAE3E3' },
                            userId: 'TO-3dL3cE',
                            userEmail: 'trail00@gmail.com',
                            meetingId: 'BM3qepMEx' 
                        } 
                }
            ]
        */
        
    });
}

// saving new Meeting.
eventEmitter.on('save-meeting', (data) => {
    MeetingModel.findOne({meetingId:data.meeting.meetingId}).exec((err,result) => {
        if(err)
            logger.error(err+'db error occurred','socketLib:event save-meeting',1)
        else if(check.isEmpty(result)){
            logger.info('No meetings found. Saving new One.','socketLib:event save-meeting',1)

            let newMeeting = new MeetingModel({
                userId:data.meeting.userId,
                userEmail:data.meeting.userEmail,
                meetingId: data.meeting.meetingId,
                title:data.meeting.title,
                location:data.meeting.location,
                purpose:data.meeting.purpose,
                start:data.meeting.start,
                end:data.meeting.end,
                color:data.meeting.color,
                createdBy:data.meeting.createdBy,
                createdOn: Date.now(),
                modifiedOn:Date.now()
            });

            newMeeting.save((err,result) => {
                if(err)
                    logger.error(err+'db error occurred','socketLib:event save-meeting',1)
                else if(check.isEmpty(result))
                    logger.error('Undedfined new Meeting. New Meeting was not saved','socketLib:event save-meeting',1)
                else
                    logger.info('success! New Meeting was saved','socketLib:event save-meeting',1)
            });
        }else {
            logger.info('Meeting is being updated','socketLib:event save-meeting',1);
            result.title=data.meeting.title;
            result.location=data.meeting.location;
            result.purpose=data.meeting.purpose;
            result.start=data.meeting.start;
            result.end=data.meeting.end;
            result.color=data.meeting.color;
            result.modifiedOn=Date.now();
                
            result.save((err,result) => {
                if(err){
                    logger.error(err+'db error occurred','socketLib:event save-meeting',1)
                }
                else if(check.isEmpty(result)){
                    logger.error('Undedfined updated Meeting. Meeting was not updated','socketLib:event save-meeting',1)
                }
                else {
                    logger.info('success! Meeting was updated','socketLib:event save-meeting',1)
                }
            })
        }
    });

}); // end of save Meeting.


eventEmitter.on('delete-meeting',(data)=>{
    MeetingModel.findOneAndRemove({meetingId:data.meeting.meetingId},(err,res)=>{
        if(err)
        logger.error('db error occurred','socketLib:event:delete-meeting',1)
        else if(check.isEmpty(res))
        logger.error('No Meetings were found','socketLib:event:delete-meeting',1)
        else{
            redisLib.getFromHash('Meetings',data.meeting.meetingId,(err,position)=>{
                if(!err && position!='' && position!=undefined){
                pos=position;clearTimeout(timeouts[pos]);
                }
            });
        logger.info('Success! Meeting was deleted.','socketLib:event:delete-meeting',10);           
        }
    })
});//end delete list model


eventEmitter.on('notify-user',(data)=>{
    redisLib.getFromHash('AllUsersList',data.meeting.userId,(err,user)=>{
        if(!err){
            let pos=0;
            if(data['action']=='save') {
                pos=timeouts.length;
                redisLib.setInHash('Meetings',data.meeting.meetingId,pos,(err,res)=>{
                    if(!err && res!='' && res!=undefined)
                    logger.info('Meeting hashed.','socketLib:event: notify-user',3)
                });
            }else if(data['action']=='update'){
                redisLib.getFromHash('Meetings',data.meeting.meetingId,(err,position)=>{
                    if(!err && position!='' && position!=undefined){
                    pos=position;timeouts[pos]=null;
                    }
                });
            }
            timeouts[pos]=setTimeout(() => {
                var mail = {
                    to: data['meeting']['userEmail'],
                    from: mailerConfig.auth.email,
                    template: 'meeting-notification',
                    subject: 'Important Meeting!',
                    context: {
                      meeting:data['meeting'],
                      start:new Date(data['meeting']['start']).toLocaleString(),
                      name: JSON.parse(user).name
                    }
                  };
                  smtpTransport.sendMail(mail, function(err) {
                    if (!err) 
                        logger.info('Meeting Notification sent!','socketLib:event:notify-user',5)
                     else 
                        logger.error(err.message,'socketLib:event:notify-user',5)
                  }); 
            },Math.round(Math.abs(new Date(new Date(data.meeting.start).setMinutes(new Date(data.meeting.start).getMinutes()-1)).getTime() - new Date().getTime())));
        }        
    })
})
module.exports = {
    setServer: setServer
}
