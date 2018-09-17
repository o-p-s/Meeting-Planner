/** DEPENDENCIES */
const redis = require('redis');
/** LIBRARIES */
const check = require("./checkLib.js"),logger = require('./loggerLib.js');

let client = redis.createClient();

client.on('connect', () => {
    console.log("\nRedis connection successfully opened.......");
});

/**
 * GENERAL HASH FUNCTIONS
 */

let getAllInAHash = (hashName, callback) => {
    client.HGETALL(hashName, (err, result) => {
        if (err) {
            console.log(err);
            callback(err, null)
        } 
        else if (check.isEmpty(result)) {
            console.log("Complete list is empty.");
            console.log(result)
            callback(null, {})
        } else {
            callback(null, result)
        }
    });
}// end get all users in a hash

// function to set new online user.
let setInHash = (hashName, key, value, callback) => {
    client.HMSET(hashName, [ key, value ], (err, result) => {
        if (err) {
            logger.error('Could not set user in hash','setUserInHash',9)
            callback(err, null)
        } else {
            logger.info('User successfully set in hash','setUserInHash',9)
            callback(null, result)
        }
    });
}// end set a new online user in hash

//function to delete user from hash.
let deleteFromHash = (hashName,key)=>{
    client.HDEL(hashName,key,(err,res)=>{
        if(!err)
        return true;
    });
}// end delete user from hash

let getFromHash=(hashName,key,callback)=>{
    client.HGET(hashName,key,(err,res)=>{
        if(res!=null) callback(null,res)
        else callback(err,null)
    })
}

module.exports = {
    getAllInAHash:getAllInAHash,
    setInHash:setInHash,
    deleteFromHash:deleteFromHash,
    getFromHash:getFromHash
}

