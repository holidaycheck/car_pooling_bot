const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();

const {loadJourneyInfoWithMembers} = require('../includes/webapp_functions');
const {loadExistsJourney,
} = require('../includes/db_functions');
const {sortUserByJourney, getDateByTime} = require('../includes/functions');

router.get('/', (req, res) => {
  const currentDate = new Date(Date.now());
  const workspaceId = req.session.userinfo.workspace_id;
  loadExistsJourney('admin_panel', workspaceId,
      '', currentDate.getTime(),
      (error) => console.log(error),
      async (results) => {
        results = sortUserByJourney(results);
        await results.map((result) => {
          result.time = getDateByTime(result.time);
          result.joins = result.joins.length;
          return result;
        });
        results.sort((journey1, journey2) => {
          if (journey1.journeyID < journey2.journeyID) return 1;
          if (journey1.journeyID > journey2.journeyID) return -1;
          return 0;
        });
        res.render('journeys', {journeys: results});
      });
});


router.get('/:journey', (req, res) => {
  const journeyId = req.params.journey;
  const workspaceId = req.session.userinfo.workspace_id;
  loadJourneyInfoWithMembers(journeyId, workspaceId)
      .then((result) => {
        result = sortUserByJourney(result)[0];
        result.time = getDateByTime(result.time);
        result.create_time = getDateByTime(result.create_time, true);
        result.joins = result.joins.map((join) => {
          join.join_at = getDateByTime(join.join_at, true);
          return join;
        });
        res.render('single_journey', {journeyInfo: result});
      })
      .catch((error) => {
        console.log(error);
      });
});

module.exports = router;
