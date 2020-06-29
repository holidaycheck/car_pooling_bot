const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const api = require('../includes/api');
const {
  getEventInfo,
  displayHome,
  sendNotificationToMessageTab,
} = require('../includes/functions');
const {
  insertNewUserIfNotExists, insertNewWorkspaceIfNotExists, updatePassword,
} = require('../includes/db_functions');
const crypto = require('crypto');


router.post('/', async function(req, res, next) {
  switch (req.body.type) {
    case 'url_verification':
      res.send(req.body.challenge);
      break;

    case 'event_callback':

      const {type, user} = getEventInfo(req.body);
      if (type == 'app_home_opened') {
        try {
          const userData = await api.callApiGet('users.info', {user: user});
          // console.log(userData);
          const teamData = await api.callApiGet(
              'team.info', {team: req.body.team_id},
          );

          insertNewWorkspaceIfNotExists(teamData.team)
              .then((WorkSpace) => {
                if (! WorkSpace.isExists) {
                  insertNewUserIfNotExists({
                    id: ':' + teamData.team.id,
                    profile: {email: 'no-email@example.com'},
                    real_name: 'WorkSpace Admin',
                    name: 'WorkSpace Admin',
                    team_id: teamData.team.id,
                  },
                  (insertResult) => {}, (selectResult) => {});
                }
                insertNewUserIfNotExists(userData.user, (insertResult) => {
                  sendNotificationToMessageTab(userData.user.id,
                      // eslint-disable-next-line max-len
                      `Hello \`${userData.user.real_name}\` \nWelcome to \`CarPoolingBot\``);
                }, (selectResult) => {
                });
              })
              .catch();
          displayHome(user);
        } catch (apiError) {
          console.log(apiError);
        }
      } else if (type == 'message') {
        if (req.body.event.client_msg_id != undefined) {
          const message = req.body.event.text;

          if (message.startsWith('PASSWORD =')) {
            const userData = await api.callApiGet('users.info', {user: user});
            if (userData.user.is_admin ||
              userData.user.is_owner) {
              password = message.replace('PASSWORD =', '').trim();
              if (password.length < 6) {
                sendNotificationToMessageTab(userData.user.id,
                    // eslint-disable-next-line max-len
                    `\`The Password length should be more then or equal to 6 chars\``);
              } else {
                sendNotificationToMessageTab(userData.user.id,
                    // eslint-disable-next-line max-len
                    `The new Password is  \`${password}\``);
                password = crypto.createHash('md5')
                    .update(password).digest('hex');
                updatePassword(userData.user.team_id, password);
              }
            } else {
              sendNotificationToMessageTab(userData.user.id,
                  'you don\'t have this Permission :joy:');
            }
          }
        }
      }

      res.send('');
      break;
    default:

      break;
  }
});

module.exports = router;
