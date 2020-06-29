const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const axios = require('axios');
const db = require('../includes/db');

router.get('/_health', (req, res, next) => {
  console.log('dust is checking the app healthly');
  res.status(200).send('');
});


router.get('/_ready', (req, res, next) => {
  console.log('dust is checking the readiness of the bot');
  axios.get('https://status.slack.com/api/v2.0.0/current')
      .then((slackApiResult) => {
        const receivedData = slackApiResult.data;
        if (!(receivedData.status == 'ok' || receivedData.status == 'active')) {
          console.log('there is a problem in Slack server');
          res.status(503);
          res.end();
        } else {
          db.query('select 1 + 1', (error, result) => {
            if (error) {
              logger.error({error});
              res.status(503);
              res.end();
            } else {
              res.status(200).send('');
            }
          });
        }
      }).catch((error) => {
        console.log('there is a problem in Slack server');
        res.status(503);
        res.end();
      });
});

router.get('/:a', (req, res, next) => {
  res.redirect('/login');
});

router.post('/:a', (req, res, next) => {
  res.redirect('/login');
});


module.exports = router;
