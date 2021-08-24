require('dotenv').config()
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const NAME = ""               // Add your name here
const PHONE = ""              // Add your phone number here

client.conversations.conversations
    .create({friendlyName: `Conversations with ${NAME}`})
    .then(conversation => {
        client.conversations.conversations(conversation.sid)
            .participants
            .create({
                'messagingBinding.address': PHONE,
                'messagingBinding.proxyAddress': '+12048186243'
            })
            .then(participant => console.log(participant))
            .catch(error => console.log(error))
    })
    .catch(error => console.log(error))

// Run the following command in the terminal:
// node create-conversation