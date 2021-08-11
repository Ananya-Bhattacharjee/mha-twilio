require('dotenv').config()
var CronJob = require('cron').CronJob;
const twilio = require('twilio')
const express = require('express')

const app = express()

const fs = require('fs')
const MESSAGES = JSON.parse(fs.readFileSync('./messages.json', 'utf8'))
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

const ACCOUNT_SID = process.env.ACCOUNT_SID;
const AUTH_TOKEN = process.env.AUTH_TOKEN; 
const PROTOCOL_REMINDER_DURATION = parseInt(process.env.PROTOCOL_REMINDER_DURATION)

const client = new twilio(ACCOUNT_SID, AUTH_TOKEN);

MESSAGES.map((message) => {
    // Create new Cron Job at specified time 
    const job = new CronJob(message.cronTime, function() {
      console.log('Starting Job')
      // If this is the first or second message in the protocol (not the reminder or assumption)
      // Simply send the message
      if (!message.isReminderOrAssumption) {
        client.messages
          .create({
            body: message.body,
            to: process.env[message.phoneNumberCode], // Text this number
            from: TWILIO_PHONE_NUMBER, // From a valid Twilio number
          })
          .then((sentMessage) => {
            console.log(`The following message was sent to ${message.phoneNumberCode} at ${sentMessage.dateCreated
                .toLocaleString('en-US', { 
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour:'2-digit',
                  minute:'2-digit',
                  timezone:'EST',
                  timeZoneName: 'short'
                })
              }:
              `
            )
            console.log(sentMessage.body)
            console.log(`Message SID: ${sentMessage.sid}`)
          })
      } 
      
      // If this is the third message in the protocol, we want to check if a rating message 
      // was sent within the PROTOCOL_REMINDER_DURATION
      else {
        client.conversations.conversations(message.channelSID)
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
                  to: process.env[message.phoneNumberCode], // Text this number
                  from: TWILIO_PHONE_NUMBER, // From a valid Twilio number
                })
                .then((sentMessage) => {
                  console.log(`The following message was sent to ${message.phoneNumberCode} at ${sentMessage.dateCreated
                      .toLocaleString('en-US', { 
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour:'2-digit',
                        minute:'2-digit',
                        timezone:'EST',
                        timeZoneName: 'short'
                      })
                    }:
                    `
                  )
                  console.log(sentMessage.body)
                  console.log(`Message SID: ${sentMessage.sid}`)
                })
              } else {
                console.log(`
                  Reminder/Assumption message was NOT sent to ${message.phoneNumberCode} at 
                  ${
                    new Date()
                      .toLocaleString('en-US', { 
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour:'2-digit',
                        minute:'2-digit',
                        timezone:'EST',
                        timeZoneName: 'short'
                      })
                  }
                `)
                console.log(`
                  ${message.phoneNumberCode} has already responded with a rating of: ${ratingMessage.body} at
                  ${
                    ratingMessage.dateCreated
                      .toLocaleString('en-US', { 
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour:'2-digit',
                        minute:'2-digit',
                        timezone:'EST',
                        timeZoneName: 'short'
                      })
                  }
                `)
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