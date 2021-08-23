exports.logSentMessage = (participant, date, messageBody, messageSID) => {
    console.log(`The following message was sent to ${participant} at ${date
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
    console.log(messageBody)
    console.log(`Message SID: ${messageSID}`)
}

exports.logDidNotSendReminder = (participant, messageBody, date) => {
    console.log(`
    Reminder/Assumption message was NOT sent to ${participant} at 
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
    ${participant} has already responded with a rating of: ${messageBody} at
    ${
        date
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