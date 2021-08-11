var CronJob = require('cron').CronJob;

const job = new CronJob('* * * * * *', function() {
    console.log('hello world')
})

job.start()