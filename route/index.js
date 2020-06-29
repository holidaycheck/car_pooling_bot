const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {isLogin, getJourneyOwnerFromJoinsList,
} = require('../includes/webapp_functions');
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
          result.isExpire = result.time < Date.now();
          result.time = getDateByTime(result.time);
          // eslint-disable-next-line max-len
          result.journeyOwnerRealName = getJourneyOwnerFromJoinsList(result.joins);
          result.joins = result.joins.length;
          return result;
        });
        results.sort((journey1, journey2) => {
          if (journey1.journeyID < journey2.journeyID) return 1;
          if (journey1.journeyID > journey2.journeyID) return -1;
          return 0;
        });
        res.render('index', {journeys: results});
      });
});


router.get('/logout', (req, res) => {
  if (isLogin(req)) {
    req.session.loggedin = false;
    req.session.userinfo = {};
  }
  res.redirect('/login');
});

module.exports = router;
