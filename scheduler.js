require('dotenv').config()
var CronJob = require('cron').CronJob;
const twilio = require('twilio')
const fs = require('fs')

const ERROR_LOGS = process.env.ERROR_LOGS;
const MESSAGES = JSON.parse(fs.readFileSync(process.env.MESSAGES, 'utf8'))
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN; 
const PROTOCOL_REMINDER_DURATION = parseInt(process.env.PROTOCOL_REMINDER_DURATION)

const client = new twilio(ACCOUNT_SID, AUTH_TOKEN);

MESSAGES.map((message) => {
    // Create new Cron Job at specified time 
    const job = new CronJob(message.cronTime, function() {
        
      // If this is the first or second message in the protocol (not the reminder or assumption)
      // Simply send the message
      if (!message.isReminderOrAssumption) {
        client.messages
          .create({
            body: message.body,
            to: process.env[message.phoneNumberCode], // Text this number
            from: TWILIO_PHONE_NUMBER, // From a valid Twilio number
          })
          .then(() => console.log('sent'))
          .catch((error) => {
            // If there is an error, log it to error log file (txt)
            fs.appendFile(ERROR_LOGS, error, () => {})
            fs.appendFile(ERROR_LOGS,'\n', () => {})
          })
      } 
      
      // If this is the third message in the protocol, we want to check if a rating message 
      // was sent within the PROTOCOL_REMINDER_DURATION
      else {
        client.conversations.conversations(message.channelSID)
          .messages
          .list({dateSent: new Date()})
          .then(m => {
              // Current date
              let reminderTime = new Date()

              const protocolReminderTime = reminderTime.getMinutes() - PROTOCOL_REMINDER_DURATION

              // Current date take away PROTOCOL_REMINDER_DURATION
              reminderTime.setMinutes(protocolReminderTime)

              // If there was no message sent, then we send a reminder. Otherwise, no reminder should be sent
              if(m[m.length - 1].dateCreated <= reminderTime) {
                client.messages
                .create({
                  body: message.body,
                  to: process.env[message.phoneNumberCode], // Text this number
                  from: TWILIO_PHONE_NUMBER, // From a valid Twilio number
                })
                .then(() => console.log('sent'))
                .catch((error) => {
                  // If there is an error, log it to error log file (txt)
                  fs.appendFile(ERROR_LOGS, error, () => {})
                  fs.appendFile(ERROR_LOGS,'\n', () => {})
                })
              }
            }
          )
          .catch((error) => {
            // If there is an error, log it to error log file (txt)
            fs.appendFile(ERROR_LOGS, error, () => {})
            fs.appendFile(ERROR_LOGS,'\n', () => {})
          })
      }
      // Makes sure cron job only runs once
      this.stop()
    }, null, true, 'Canada/Eastern');
    job.start();
})