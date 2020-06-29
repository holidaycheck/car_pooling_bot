const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {checkModuleDataValidationAndGetErrorList,
  readCheckingErrorReport, getTimeOfDate,
} = require('../includes/functions');
const {joinJourney, createNewJourney} = require('../includes/db_functions');
const uuid = require('uuid');

router.get('/', (req, res) => {
  res.render('new_journey');
});


router.post('/', (req, res) => {
  const newJourneyInformation = req.body;
  newJourneyInformation.backJourney = 'no';

  const errorOfCheckingModuleDataValidation = (
    checkModuleDataValidationAndGetErrorList(
        'create_journey', newJourneyInformation));
  const isDataValid = readCheckingErrorReport(
      errorOfCheckingModuleDataValidation);
  if (! isDataValid) {
    res.render('new_journey', {errors: errorOfCheckingModuleDataValidation});
    return;
  }

  const journeyDataForDB = {
    uuid: uuid.v4(),
    user: ':' + req.session.userinfo.workspace_id,
    from_location: newJourneyInformation.from,
    to_location: newJourneyInformation.to,
    start_date: getTimeOfDate(newJourneyInformation.start),
    time: getTimeOfDate(newJourneyInformation.start,
        newJourneyInformation.startTime),
    person_count: parseInt(newJourneyInformation.personCount) + 1,
    create_time: Date.now(),
    workspace: req.session.userinfo.workspace_id,
  };

  createNewJourney(
      journeyDataForDB,
      (error) => {
        console.log(error);
      },
      async (result) => {
        joinJourney(result.insertId, ':' + req.session.userinfo.workspace_id,
            req.session.userinfo.workspace_id, (error) => {
              console.log(error);
            }, () => {});
        res.redirect('/view/' + journeyDataForDB.uuid);
      },
  );
});

module.exports = router;
