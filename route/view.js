const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {loadJourneyInfoWithMembers,
  getJourneyOwnerFromJoinsList} = require('../includes/webapp_functions');
const {sortUserByJourney, getDateByTime} = require('../includes/functions');


router.get('/:journey_uuid', (req, res) => {
  const journeyUUID = req.params.journey_uuid;
  const workspaceId = req.session.userinfo.workspace_id;
  loadJourneyInfoWithMembers(journeyUUID, workspaceId)
      .then((result) => {
        if (! result.length) {
          res.render('error', {error: {status: ''}, message:
          // eslint-disable-next-line max-len
          'this journey is not exists or you don\'t have permission to view it'});
          return;
        }
        result = sortUserByJourney(result)[0];
        result.journeyCreator = getJourneyOwnerFromJoinsList(result.joins);
        result.time = getDateByTime(result.time);
        result.create_time = getDateByTime(result.create_time, true);
        result.joins = result.joins.map((join) => {
          join.join_at = getDateByTime(join.join_at, true);
          return join;
        });
        const deletableJourney = result.slack_id.startsWith(':');
        res.render('single_journey',
            {journeyInfo: result, canDelete: deletableJourney});
      })
      .catch((error) => {
        console.log(error);
      });
});

module.exports = router;
