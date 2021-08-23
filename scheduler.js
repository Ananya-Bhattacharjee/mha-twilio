require('dotenv').config()
var CronJob = require('cron').CronJob;
const twilio = require('twilio')
const express = require('express')
const { logSentMessage, logDidNotSendReminder } = require('./log-sent-messages')
const { generateMessagesFromSchedule } = require('./generate-messages')

const app = express()

const fs = require('fs')
const SCHEDULE = JSON.parse(fs.readFileSync('./schedule.json', 'utf8'))
const MESSAGES = generateMessagesFromSchedule(SCHEDULE)

// const MESSAGES = JSON.parse(fs.readFileSync('./messages.json', 'utf8'))

const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN; 
const PROTOCOL_REMINDER_DURATION = parseInt(process.env.PROTOCOL_REMINDER_DURATION)

const client = new twilio(ACCOUNT_SID, AUTH_TOKEN);

MESSAGES.map((message) => {

    const [name, phone, channelSID] = process.env[message.participantCode].split(',')

    // Create new Cron Job at specified time 
    const job = new CronJob(message.cronTime, function() {
      console.log('Starting Job')
      // If this is the first or second message in the protocol (not the reminder or assumption)
      // Simply send the message
      if (!message.isReminderOrAssumption) {
        client.messages
          .create({
            body: message.body,
            to: phone, // Text this number
            from: TWILIO_PHONE_NUMBER, // From a valid Twilio number
          })
          .then((sentMessage) => {
            logSentMessage(
              message.participantCode,
              sentMessage.dateCreated,
              sentMessage.body,
              sentMessage.sid
            )
          })
      } 
      
      // If this is the third message in the protocol, we want to check if a rating message 
      // was sent within the PROTOCOL_REMINDER_DURATION
      else {
        client.conversations.conversations(channelSID)
          .messages
          .list({dateSent: new Date()})
          .then(participantReplies => {
              // Current date
              let reminderTime = new Date()

              const protocolReminderTime = reminderTime.getMinutes() - PROTOCOL_REMINDER_DURATION

              // Current date take away PROTOCOL_REMINDER_DURATION
              reminderTime.setMinutes(protocolReminderTime)

              // last rating message sent by participant
              const ratingMessage = participantReplies[participantReplies.length - 1]

              // If there was no message sent, then we send a reminder. Otherwise, no reminder should be sent
              if(ratingMessage.dateCreated <= reminderTime) {
                client.messages
                .create({
                  body: message.body,
                  to: phone, // Text this number
                  from: TWILIO_PHONE_NUMBER, // From a valid Twilio number
                })
                .then((sentMessage) => {
                  logSentMessage(
                    message.participantCode, 
                    sentMessage.dateCreated, 
                    sentMessage.body, 
                    sentMessage.sid
                  )
                })
              } else {
                logDidNotSendReminder(
                  message.participantCode, 
                  ratingMessage.body, 
                  ratingMessage.dateCreated
                )
              }
            }
          )
      }
      // Makes sure cron job only runs once
      this.stop()
    }, null, true, 'Canada/Eastern');
    job.start();
})

// Start server
const PORT = process.env.PORT || 5000
app.listen(PORT, console.log(`Server running on port ${PORT}`))