const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {loadWorkspaceMembers,
  getMemberJourney} = require('../includes/db_functions');
const {getDateByTime} = require('../includes/functions');

router.get('/:slack_id', (req, res) => {
  const memberSlackId = req.params.slack_id;
  const memberWorkspaceId = req.session.userinfo.workspace_id;
  getMemberJourney(memberSlackId, memberWorkspaceId)
      .then(async (results) => {
        if (! results.length) {
          res.render('error', {error: {status: ''}, message:
          // eslint-disable-next-line max-len
           `This member doesn't have any journey or he doesn't exist! or you don't have access permission.`});
          return;
        }
        await results.map((result) => {
          result.time = getDateByTime(result.time);
          return result;
        });
        res.render('member', {journeys: results});
      })
      .catch((error) => {
        console.log(error);
      });
});

router.get('/', (req, res) => {
  const workspaceId = req.session.userinfo.workspace_id;
  loadWorkspaceMembers(workspaceId)
      .then(async (results) => {
        res.render('members', {members: results});
        res.send('');
      })
      .catch((error) => {
        console.log(error);
      });
});

module.exports = router;
