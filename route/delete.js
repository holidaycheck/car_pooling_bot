const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {getJourneyInfo, getJourneyMembers,
  deleteJourney} = require('../includes/db_functions');
const {getDateByTime, sendNotificationToMessageTab,
} = require('../includes/functions');

router.post('/:uuid', (req, res) => {
  const journeyUUID = req.params.uuid;
  getJourneyInfo(journeyUUID, true, (error) => {
    console.log(error);
  },
  (journeyInfo) => {
    journeyInfo = journeyInfo[0];
    const deleteMessage = req.body.delete_message.trim();
    journeyInfo.time = getDateByTime(journeyInfo.time);
    getJourneyMembers(journeyInfo.id, (error) => {},
        async (members) => {
          if (members.length > 1) {
            await members.forEach((member) => {
              if (member.slack_id != journeyInfo.user_slackID) {
                sendNotificationToMessageTab(
                    member.slack_id,
                    // eslint-disable-next-line max-len
                    `the journey of \`${journeyInfo.user_realName}\`, from \`${journeyInfo.from_location}\` to \`${journeyInfo.to_location}\` is deleted` + (
                                     // eslint-disable-next-line max-len
                                     deleteMessage !== '' ? ` and he/she said : \`${deleteMessage}\`` : ''
                    ),
                );
              }
            });
          }
          deleteJourney(journeyInfo.id);
          res.redirect('/');
        });
  });
});

router.get('/:uuid', (req, res) => {
  const journeyUUID = req.params.uuid;
  getJourneyInfo(journeyUUID, true, (error) => {
    console.log(error);
  },
  (journeyInfo) => {
    journeyInfo = journeyInfo[0];
    journeyInfo.time = getDateByTime(journeyInfo.time);
    res.render('delete_form', {journeyInfo: journeyInfo});
  });
});

module.exports = router;
