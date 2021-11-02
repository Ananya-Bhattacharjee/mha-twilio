const fs = require('fs');
const participants = [
    {
        "name": "Ananya",
        "participantCode": "P1",
        "phone": "+16476196982"
    },
    {
        "name": "Pan Chen",
        "participantCode": "P2",
        "phone": "+16476861520"
    }
]

require('dotenv').config()
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const NAME = "Pan"               // Add your name here
const PHONE = "+12048186243"              // Add your phone number here

// fs.appendFile('.env', '\ndata to append', function (err) {
//     if (err) throw err;
//     console.log('Saved!');
//   });



const yourDate = new Date()
yourDate.toISOString().split('T')[0]

for (participant of participants) {
    const name = participant.name;
    const phone = participant.phone;
    const participantCode = participant.participantCode;
    client.conversations.participantConversations
        .list({ address: phone, limit: 20 })
        .then(participantConversations => {
            if (participantConversations.length == 0) {
                client.conversations.conversations
                    .create({ friendlyName: `With ${name} created at: ${yourDate}` })
                    .then(conversation => {
                        console.log(conversation)
                        client.conversations.conversations(conversation.sid)
                            .participants
                            .create({
                                'messagingBinding.address': phone,
                                'messagingBinding.proxyAddress': '+12048186243'
                            })
                            .then(participant => {
                                console.log("hi")
                                fs.appendFile('.env', `\n${participantCode}=${name},${phone},${conversation.sid}`, function (err) {
                                    if (err) throw err;
                                    console.log('Saved!');
                                });
                            })
                            .catch(error => {
                                console.log(error)
                            }
                            )
                    })
            }
            else {
                participantConversations.forEach(p => {
                    const conversation_id = p.conversationSid;
                    const participant_id = p.participantSid;

                    client.conversations.conversations(conversation_id)
                        .participants(participant_id)
                        .remove()
                        .then(e => {
                            client.conversations.conversations
                                .create({ friendlyName: `With ${name} created at: ${yourDate}` })
                                .then(conversation => {
                                    client.conversations.conversations(conversation.sid)
                                        .participants
                                        .create({
                                            'messagingBinding.address': phone,
                                            'messagingBinding.proxyAddress': '+12048186243'
                                        })
                                        .then(participant => {
                                            console.log("hi")
                                            fs.appendFile('.env', `\nP1=${name},${phone},${conversation.sid}`, function (err) {
                                                if (err) throw err;
                                                console.log('Saved!');
                                            });
                                        })
                                        .catch(error => {
                                            console.log(error)
                                        }
                                        )
                                })
                        });
                }
                )
            }
        })
}