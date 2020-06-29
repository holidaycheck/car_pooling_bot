/* eslint-disable max-len */
const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const api = require('../includes/api');
const {
  getViewContent, getBlocksID, getModuleTitle,
  fetchDataViaBlocksId, checkModuleDataValidationAndGetErrorList,
  readCheckingErrorReport, getErrorTemplate, getTimeOfDate,
  generateSingleJourneyFromTemplate, sortUserByJourney,
  sendNotificationToMessageTab,
  showInformationBox, deleteMessageModule, getDateByTime,
  backJourneyResponse, fetchInfoFromStaticText} = require('../includes/functions');

const {
  createNewJourney,
  loadExistsJourney,
  joinJourney,
  removeUserFromJourney,
  getJourneyOwner, getJourneyMembers,
  deleteJourney, getJourneyInfo,
} = require('../includes/db_functions');
const uuid = require('uuid');


router.post('/', async function(req, res, next) {
  const payload = JSON.parse(req.body.payload);
  const workspace = payload.team;

  switch (payload.type) {
    case 'block_actions':

      const clickedButton = payload.actions[0].value;

      if (clickedButton == 'create_journey') {
        const currentDate = new Date(Date.now());
        await api.callApiPost('views.open', {trigger_id: payload.trigger_id,
          view: (await getViewContent('createJourney'))
              .replace('{todayDate}',
                  `${currentDate.getFullYear()}-${currentDate.getMonth()+1}-${currentDate.getDate()}`)},
        );
        res.send('');
      } else if (clickedButton == 'load_exists_journey') {
        const currentDate = new Date(Date.now());

        loadExistsJourney(clickedButton, workspace.id, payload.user.id, currentDate.getTime(),
            (error) => {
              logger.error({error});
            },
            async (results) => {
              results = sortUserByJourney(results);
              results = results.filter((journey) => {
                return ! (journey.joins.some((join) => join.slack_id == payload.user.id) || journey.person_count == journey.joins.length);
              });
              const finalResults = await results.map(async (singleJourney) => {
                return await generateSingleJourneyFromTemplate(clickedButton, singleJourney);
              });

              Promise.all(finalResults).then(async (Alljourney) => {
                await api.callApiPost('views.open',
                    {trigger_id: payload.trigger_id,
                      view: (await getViewContent('availableJourney'))
                          .replace('{{_replace_with_journey}}',
                              (Alljourney.length == 0 ? await getViewContent('noJourneyFound') : Alljourney.join(',')))});
                res.send('');
              });
            });
      } else if (clickedButton == 'load_created_journey') {
        const currentDate = new Date(Date.now());

        loadExistsJourney(clickedButton, workspace.id, payload.user.id, currentDate.getTime(),
            (error) => {
              logger.error({error});
            },
            async (results) => {
              results = sortUserByJourney(results);
              const finalResults = await results.map(async (singleJourney) => {
                return await generateSingleJourneyFromTemplate(clickedButton, singleJourney);
              });

              Promise.all(finalResults).then(async (Alljourney) => {
                await api.callApiPost('views.open', {trigger_id: payload.trigger_id,
                  view: (await getViewContent('userCreatedJourney')).replace('{{_replace_with_journey}}',
                      (Alljourney.length == 0 ? await getViewContent('noJourneyFound') : Alljourney.join(',')))});

                res.send('');
              });
            });
      } else if (clickedButton == 'load_joined_journey') {
        const currentDate = new Date(Date.now());

        loadExistsJourney(clickedButton, workspace.id, payload.user.id, currentDate.getTime(),
            (error) => {
              logger.error({error});
            },
            async (results) => {
              results = await sortUserByJourney(results);

              results = results.filter((journey) => {
                return journey.joins.some((join) => join.slack_id == payload.user.id) && journey.journeyCreator != payload.user.id;
              });
              const finalResults = await results.map(async (singleJourney) => {
                return await generateSingleJourneyFromTemplate(clickedButton, singleJourney);
              });

              Promise.all(finalResults).then(async (Alljourney) => {
                await api.callApiPost('views.open', {trigger_id: payload.trigger_id,
                  view: (await getViewContent('joinedJourney')).replace('{{_replace_with_journey}}',
                      (Alljourney.length == 0 ? await getViewContent('noJourneyFound') : Alljourney.join(',')))});

                res.send('');
              });
            });
      } else if (clickedButton.startsWith('join_journey_')) {
        const journeyID = clickedButton.replace('join_journey_', '');

        joinJourney(journeyID, payload.user.id, workspace.id,
            (error) => {
              console.log(error);
            },
            (result) => {
              getJourneyOwner(journeyID, (error) => {}, (result) => {
                sendNotificationToMessageTab(result[0].user,
                    `User \`${payload.user.name}\` Joined your journey from \`${result[0].from_location}\` to \`${result[0].to_location}\``);
              });
              showInformationBox(res, payload.trigger_id, payload.view.id, 'you joind to the journey successfuly');
            },
        );
      } else if (clickedButton.startsWith('leave_journey_')) {
        const journeyID = clickedButton.replace('leave_journey_', '');

        removeUserFromJourney(journeyID, payload.user.id,
            (error) => {
              console.log(error);
            },
            (result) => {
              getJourneyOwner(journeyID, (error) => {

              }, (result) => {
                sendNotificationToMessageTab(result[0].user,
                    `User \`${payload.user.name}\` left your journey from \`${result[0].from_location}\` to \`${result[0].to_location}\``);
              });

              showInformationBox(res, payload.trigger_id, payload.view.id, 'you are not anymore in the journey');
            },
        );
      } else if (clickedButton.startsWith('delete_journey_')) {
        const journeyID = clickedButton.replace('delete_journey_', '');
        deleteMessageModule(payload.trigger_id, payload.view.id, journeyID);
      }
      break;

      // Modules Submissions for create and loads
    case 'view_submission':
      const moduleName = getModuleTitle(payload);

      if (moduleName == 'Create New Journey') {
        const blocksIds = getBlocksID('create_journey', payload.view.blocks);
        const moduleGivenInformations = fetchDataViaBlocksId('create_journey', blocksIds, payload.view.state.values);
        const errorOfCheckingModuleDataValidation = checkModuleDataValidationAndGetErrorList('create_journey', moduleGivenInformations);
        const isDataValid = readCheckingErrorReport(errorOfCheckingModuleDataValidation);
        if (! isDataValid) {
          const errorsTemplate = getErrorTemplate(errorOfCheckingModuleDataValidation);
          res.send(errorsTemplate);
          return;
        }

        const journeyDataForDB = {
          uuid: uuid.v4(),
          user: payload.user.id,
          from_location: moduleGivenInformations.from,
          to_location: moduleGivenInformations.to,
          start_date: getTimeOfDate(moduleGivenInformations.start),
          time: getTimeOfDate(moduleGivenInformations.start, moduleGivenInformations.startTime),
          person_count: parseInt(moduleGivenInformations.personCount) + 1,
          create_time: Date.now(),
          workspace: workspace.id,
        };

        createNewJourney(
            journeyDataForDB,
            (error) => {
              console.log(error);
            },
            (result) => {
              joinJourney(result.insertId, payload.user.id, workspace.id, (error) => {
                console.log(error);
              }, () => {});
              if (moduleGivenInformations.backJourney === 'no') {
                showInformationBox(res, '', '', 'The Journey have been created successfuly');
              } else {
                backJourneyResponse(moduleGivenInformations, payload.trigger_id, payload.view.id);
                res.send('');
              }
            },
        );
      } else if (moduleName == 'Back Journey') {
        const blocksIds = getBlocksID('create_back_journey', payload.view.blocks);
        const moduleGivenInformations = fetchDataViaBlocksId('create_back_journey', blocksIds, payload.view.state.values);
        moduleGivenInformations.from = fetchInfoFromStaticText(blocksIds.from, payload.view.blocks);
        moduleGivenInformations.to = fetchInfoFromStaticText(blocksIds.to, payload.view.blocks);
        moduleGivenInformations.personCount = fetchInfoFromStaticText(blocksIds.personCount, payload.view.blocks);
        moduleGivenInformations.backJourney = 'no';
        const errorOfCheckingModuleDataValidation = checkModuleDataValidationAndGetErrorList('create_journey', moduleGivenInformations);
        const isDataValid = readCheckingErrorReport(errorOfCheckingModuleDataValidation);

        if (! isDataValid) {
          const errorsTemplate = getErrorTemplate(errorOfCheckingModuleDataValidation);
          res.send(errorsTemplate);
          return;
        }

        const journeyDataForDB = {
          uuid: uuid.v4(),
          user: payload.user.id,
          from_location: moduleGivenInformations.from,
          to_location: moduleGivenInformations.to,
          start_date: getTimeOfDate(moduleGivenInformations.start),
          time: getTimeOfDate(moduleGivenInformations.start, moduleGivenInformations.startTime),
          person_count: parseInt(moduleGivenInformations.personCount) + 1,
          create_time: Date.now(),
          workspace: workspace.id,
        };

        createNewJourney(
            journeyDataForDB,
            (error) => {
              console.log(error);
            },
            (result) => {
              joinJourney(result.insertId, payload.user.id, workspace.id, (error) => {
                console.log(error);
              }, () => {});

              showInformationBox(res, '', '', 'The Journey have been created successfuly');
            },
        );
      } else if (moduleName.startsWith('Delete journey')) {
        const journeyID = moduleName.replace('Delete journey', '').trim();
        const blocksIds = getBlocksID('delete_message', payload.view.blocks);
        const moduleGivenInformations = fetchDataViaBlocksId('delete_message', blocksIds, payload.view.state.values);

        getJourneyInfo(journeyID, false, (error) => {
          console.log(error);
        },
        (journeyInfo) => {
          journeyInfo = journeyInfo[0];
          journeyInfo.time = getDateByTime(journeyInfo.time);
          getJourneyMembers(journeyID, (error) => {},
              async (members) => {
                if (members.length > 1) {
                  await members.forEach((member) => {
                    if (member.slack_id != journeyInfo.user_slackID) {
                      sendNotificationToMessageTab(
                          member.slack_id,
                          `The journey that has been initiated by \`${journeyInfo.user_realName}\`, from \`${journeyInfo.from_location}\` to \`${journeyInfo.to_location}\` is deleted!` + (
                            typeof moduleGivenInformations.delete_message != 'undefined' ? ` and the reason is: \`${moduleGivenInformations.delete_message}\`` : ''
                          ),
                      );
                    }
                  });
                }
                deleteJourney(journeyID);
                showInformationBox(res, '', '', 'The journey have been successfully deleted');
              });
        });
      }


      break;

    default:
      break;
  }
});

module.exports = router;
