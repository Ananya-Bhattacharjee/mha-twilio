require('dotenv').config()
const fs = require('fs')

const MESSAGE_BANK = JSON.parse(fs.readFileSync('./message-bank.json', 'utf8'))
const PROTOCOL_REMINDER_DURATION = parseInt(process.env.PROTOCOL_REMINDER_DURATION);

const RATING = "How glad are you receiving that message at the moment you did, based on the state you were in? Please reply with a rating between 1 (Not glad at all)  to 3 (ok) to 5 (super glad to receive it)."

const MESSAGE_TYPES = {
    A1: "Assumption 1",
    A2: "Assumption 2",
    A3: "Assumption 3",
    R: "Reminder"
}

const reminder = (name) => {
    return `Hello, ${name}! We’re just sending a friendly reminder to encourage you to reply to the previous prompt with your rating. We value your feedback as it helps us send more useful messages to you and other users.`
}

const assumption1 = (name, rating) => {
    return `Hello, ${name}! We noticed you didn’t get around to replying to our previous prompt yet, which is completely fine. However, if you are unable to respond today, we will make an assumption about your rating to save time and reduce your burden. WE WILL ASSUME YOU RATE TODAY'S MESSAGE A ${rating}. Many technologies make these assumptions randomly. If we're wrong, please let us know so we can give you and others the most useful possible messages.`
}

const assumption2 = (name, rating) => {
    return `Hello, ${name}! We noticed you didn’t get around to replying to our previous prompt yet, which is completely fine. However, if you are unable to respond today, we will make an assumption about your rating to save time and reduce your burden. WE WILL ASSUME YOU RATE TODAY'S MESSAGE A ${rating}. Many technologies make these assumptions from a particular user’s past interaction with the technology. If we're wrong, please let us know so we can give you and others the most useful possible messages. `
}

const assumption3 = (name, rating) => {
    return `Hello, ${name}! We noticed you didn’t get around to replying to our previous prompt yet, which is completely fine. However, if you are unable to respond today, we will make an assumption about your rating to save time and reduce your burden. WE WILL ASSUME YOU RATE TODAY'S MESSAGE A ${rating}. Many technologies make these assumptions from other users’ interactions with the technology. If we're wrong, please let us know so we can give you and others the most useful possible messages.`
}

const getCronTimes = (message) => {
    const [
        firstMessageHours,
        firstMessageMinutes
    ] = message.time.split(':').map(item => parseInt(item))

    const [day, month] = message.date.split('/').map(item => parseInt(item))

    const cronTime1 = `0 ${firstMessageMinutes} ${firstMessageHours} ${day} ${month - 1} *`
    const cronTime2 = firstMessageHours + 1 >= 24 ? `0 ${firstMessageMinutes} ${firstMessageHours + 1 - 24} ${day+1} ${month - 1} *`: `0 ${firstMessageMinutes} ${firstMessageHours + 1} ${day} ${month - 1} *`

    const additionalHours = Math.floor((firstMessageMinutes + PROTOCOL_REMINDER_DURATION) / 60)
    const newMinutes = (firstMessageMinutes + PROTOCOL_REMINDER_DURATION) % 60

    const cronTime3 = firstMessageHours + 1 + additionalHours >= 24 ? `0 ${newMinutes} ${firstMessageHours + additionalHours + 1 - 24} ${day + 1} ${month - 1} *`: `0 ${newMinutes} ${firstMessageHours + 1 + additionalHours} ${day} ${month - 1} *`

    return {first: cronTime1, second: cronTime2, third: cronTime3}
}

const getThirdMessage = (participantCode, messageType, name, assumedRating, cronTime) => {
    switch (messageType) {
        case MESSAGE_TYPES.A1:
            return {
                cronTime: cronTime, 
                participantCode: participantCode,
                isReminderOrAssumption: true,
                body: assumption1(name, assumedRating)
            }

        case MESSAGE_TYPES.A2:
            return {
                cronTime: cronTime, 
                participantCode: participantCode,
                isReminderOrAssumption: true,
                body: assumption2(name, assumedRating)
            }

        case MESSAGE_TYPES.A3:
            return {
                cronTime: cronTime, 
                participantCode: participantCode,
                isReminderOrAssumption: true,
                body: assumption3(name, assumedRating)
            }

        case MESSAGE_TYPES.R:
            return {
                cronTime: cronTime, 
                participantCode: participantCode,
                isReminderOrAssumption: true,
                body: reminder(name)
            }

        default: 
            return {
                cronTime: cronTime, 
                participantCode: participantCode,
                isReminderOrAssumption: true,
                body: reminder(name)
            }
    }
}

exports.generateMessagesFromSchedule = (schedule) => {
    var scheduledMessages = []

    schedule.map(entry => {
        const [name] = process.env[entry.participantCode].split(',')

        entry.messages.map(message => {

            cronTimes = getCronTimes(message)

            scheduledMessages.push({
                cronTime: cronTimes.first, 
                participantCode: entry.participantCode,
                isReminderOrAssumption: false,
                body: MESSAGE_BANK[message.messageCode]
            })

            scheduledMessages.push({
                cronTime: cronTimes.second, 
                participantCode: entry.participantCode,
                isReminderOrAssumption: false,
                body: RATING
            })

            scheduledMessages.push(
                getThirdMessage(
                    entry.participantCode,
                    message.messageType, 
                    name, 
                    message.assumedRating, 
                    cronTimes.third
                )
            )
        })
    })

    return scheduledMessages
}

// For testing out generateMessagesFromSchedule
// const newSchedule = JSON.parse(fs.readFileSync('./schedule.json', 'utf8'));
// console.log(generateMessagesFromSchedule(newSchedule))