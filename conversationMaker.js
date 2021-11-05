const fs = require('fs');

const moment = require('moment');
const XLSX = require('xlsx');
const workbook = XLSX.readFile('row.xlsx', {
    cellDates:true
  });

const sheet_name_list = workbook.SheetNames;

const row_schedule = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);


let schedules = [];
let participants = [];

for(row of row_schedule) {
    participant_code = row["ParticipantCode"];
    day= row["Day"];
    time = row["Preference"];
    message = row["Message"];
    message_type = row["Message Type"];
    assumed_rating = row["Message Type"] != "Reminder" ? row["Assumed Rating"].toString() : 0;
    new_message =  {
        "messageCode": message,
        "messageType": message_type,
        "assumedRating": assumed_rating,
        "date": day,
        "time": moment(time).format("HH:MM:SS")
    }
    found = false
    for(schedule of schedules) {
        if(schedule["participantCode"] == participant_code) {
            found = true
            schedule["messages"].push(new_message)
            break
        }
    }
    if(!found) {
        participants.push({
            "name": row["Name"],
            "participantCode": participant_code,
            "phone": "+1" + row["PhoneNumber"]
        })
        schedules.push({
            "participantCode": participant_code,
            "messages": [
                new_message
            ]
        })
    }
}

let data = JSON.stringify(schedules);
fs.writeFileSync('test.json', data);

require('dotenv').config()
const accountSid = process.env.ACCOUNT_SID;
const authToken = process.env.AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

const yourDate = new Date()
yourDate.toISOString().split('T')[0]


participants_for_env = []
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
                        client.conversations.conversations(conversation.sid)
                            .participants
                            .create({
                                'messagingBinding.address': phone,
                                'messagingBinding.proxyAddress': '+12048186243'
                            })
                            .then(participant => {
                                fs.appendFile('.env', `\n${participantCode}=${name},${phone},${conversation.sid}`, function (err) {
                                    if (err) throw err;
                                    console.log('Created a conversation!');
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
                                            fs.appendFile('.env', `\n${participantCode}=${name},${phone},${conversation.sid}`, function (err) {
                                                if (err) throw err;
                                                console.log('Created a conversation!');
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