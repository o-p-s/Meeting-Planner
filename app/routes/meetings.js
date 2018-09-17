const express = require('express');
const router = express.Router();
const meetingsController = require('./../controllers/meetingsController')
const appConfig = require("../../config/appConfig")
const auth = require('../middlewares/auth')


module.exports.setRouter = (app) => {
    let baseUrl = `${appConfig.apiVersion}/meetings`;

    app.get(`${baseUrl}/get/by/user`,auth.isAuthorized,meetingsController.getUserMeetings)
        /**
     * @apiGroup Read
     * @apiVersion  1.0.0
     * @api {post} /api/v1/meetings/get/by/user Fetch Meetings.
     * 
     * @apiParam {string} userId userId of the user. (query params) (required)
     * @apiParam {string} authToken authToken of requesting user. (query params) (required)
     * @apiSuccess {object} myResponse shows error status, message, http status code, result.
     * 
     * @apiSuccessExample {object} Success-Response:
         {
            "error": false,
            "message": "All meetings found",
            "status": 200,
            "data": [ 
                { 
                    userEmail: 'trail00@gmail.com',
                    createdBy: ' adminName S',
                    color: { primary: '#ad2121', secondary: '#FAE3E3' },
                    end: 2018-09-16T18:29:59.999Z,
                    start: 2018-09-15T18:30:00.000Z,
                    purpose: 'Client.....',
                    location: 'New York',
                    title: 'Client Meeting',
                    meetingId: '6XEDCbWKD',
                    userId: 'TO-3dL3cE' 
                } 
            ]

        }
    */
}