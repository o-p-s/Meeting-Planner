/** DEPENDENCIES */
const  hbs = require('nodemailer-express-handlebars'),nodemailer = require('nodemailer'), path =require('path');
/** CONFIGS */
const mailerConfig=require('./../../config/mailerConfig');

let smtpTransport = nodemailer.createTransport({
    service:mailerConfig.service,
    secure:true,
    auth: {
      user: mailerConfig.auth.email,
      pass: mailerConfig.auth.password
    }
});
  
let handlebarsOptions = {
      viewEngine: 'handlebars',
      viewPath: path.resolve('./app/templates/'),
      extName: '.html'
};
    
   smtpTransport.use('compile', hbs(handlebarsOptions));
    
module.exports={
        smtpTransport:smtpTransport
}