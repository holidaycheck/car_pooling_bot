const {loadExistsJourney} = require('./db_functions');
const {
  sortUserByJourney, sendNotificationToMessageTab,
} = require('./functions');
const schedule = require('node-schedule');

schedule.scheduleJob('* * * * *', () => {
  const timeNow = (new Date(Date.now())).getTime();
  // console.log('start new cron job ' + timeNow)
  loadExistsJourney('load_exists_journey', '', '', timeNow,
      (error) => {
        console.log(error);
      },
      async (journeys) => {
        journeys = await sortUserByJourney(journeys);
        journeys = journeys.filter((journey) => {
          return (journey.time - timeNow) < (162000);
        }); // 162000 = 2 hour

        journeys.forEach((journey) => {
          journey.joins.forEach((user) => {
            sendNotificationToMessageTab(user.slack_id,
                // eslint-disable-next-line max-len
                `Reminder! The Journey from \`${journey.from_location}\` to \`${journey.to_location}\` will start at \`${new Date}\``,
            );
          });
        });
      });
});
