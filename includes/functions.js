const fs = require('fs');
const api = require('./api');
/**
 * fetching the data via block id
 * @param {string} id blockid
 * @param {Object} blockContent
 * @return {String}
 */
function fetchDataViaSingleBlocksId(id, blockContent) {
  const block = blockContent[id];
  const key = Object.keys(block)[0];
  if (block[key].type == 'plain_text_input') {
    return block[key].value;
  } else if (block[key].type == 'datepicker') {
    return block[key].selected_date;
  } else if (block[key].type == 'static_select') {
    return block[key].selected_option.value;
  } else if (block[key].type == 'radio_buttons') {
    return block[key].selected_option.value;
  } else {
    return block[key];
  }
}

const getEventInfo = (requestContent) => requestContent.event;

const getViewContent = (jsonFileName) => {
  return fs.readFileSync(`./payload/${jsonFileName}.json`, 'utf8');
};

/**
 * display home tab to the user when opening home tab
 * @param {string} user UserSlackID
 * @return {string}
*/
async function displayHome(user) {
  const args = {
    token: require('./slack_token'),
    user_id: user,
    view: fs.readFileSync(`./payload/appHome.json`, 'utf8'),
  };
  await api.callApiPost('views.publish', args);
}

/**
 * display error tab to the user when opening home tab
 * @param {string} user UserSlackID
 * @return {string}
*/
async function displayError(user) {
  const args = {
    token: require('./slack_token'),
    user_id: user,
    view: fs.readFileSync(`./payload/alertModule.json`, 'utf8'),
  };
  const result = await api.callApiPost('views.publish', args);
  try {
    if (result) {
      console.log(result);
    }
  } catch (e) {
    console.log(e);
  }
}

/**
 * Get blocks id from payload
 * @param {string} moduleName
 * @param {object} allBlocks
 * @return {string}
 */
function getBlocksID(moduleName, allBlocks) {
  let ids;
  switch (moduleName) {
    case 'create_journey':
      ids = {
        from: allBlocks[2].block_id,
        to: allBlocks[3].block_id,
        start: allBlocks[4].block_id,
        startTime: allBlocks[5].block_id,
        personCount: allBlocks[6].block_id,
        backJourney: allBlocks[7].block_id,
      };
      break;

    case 'delete_message':
      ids = {
        delete_message: allBlocks[0].block_id,
      };
      break;

    case 'create_back_journey':
      ids = {
        from: allBlocks[2].block_id,
        to: allBlocks[3].block_id,
        start: allBlocks[7].block_id,
        startTime: allBlocks[8].block_id,
        personCount: allBlocks[6].block_id,
      };
      break;
  }
  return ids;
}


/**
 * get Method title
 * @param {object} payload
 * @return {string}
 */
const getModuleTitle = (payload) => payload.view.title.text;

/**
 * Fetch data via block id
 * @param {string} moduleName
 * @param {string} ids
 * @param {object} moduleValues
 * @return {*}
 */
function fetchDataViaBlocksId(moduleName, ids, moduleValues) {
  const data = {};
  switch (moduleName) {
    case 'create_journey':
      data.from = fetchDataViaSingleBlocksId(ids.from, moduleValues);
      data.to = fetchDataViaSingleBlocksId(ids.to, moduleValues);
      data.start = fetchDataViaSingleBlocksId(ids.start, moduleValues);
      data.startTime = fetchDataViaSingleBlocksId(ids.startTime, moduleValues);
      data.personCount = fetchDataViaSingleBlocksId(
          ids.personCount, moduleValues,
      );
      data.backJourney = fetchDataViaSingleBlocksId(
          ids.backJourney, moduleValues,
      );
      break;

    case 'delete_message':
      data.delete_message = fetchDataViaSingleBlocksId(
          ids.delete_message, moduleValues,
      );
      break;

    case 'create_back_journey':
      data.start = fetchDataViaSingleBlocksId(ids.start, moduleValues);
      data.startTime = fetchDataViaSingleBlocksId(ids.startTime, moduleValues);
      break;
  }

  return data;
}

/**
 * check if the given date is valid ot not & return the error list
 * @param {int/string} startDate
 * @return {array}
 */
function isDateValid(startDate) {
  const errors = [];
  const currentDate = (new Date(Date.now())).setHours(0, 0, 0, 0);
  startDate = Date.parse(startDate);

  if (isNaN(startDate)) {
    errors.push('error in the given start time');
  }


  if (startDate < currentDate) {
    errors.push('The journey can not start in the past');
  }

  return errors;
}


/**
 *
 * @param {string} stringDate
 * @param {string} stringHour
 * @return {Integer}
 */
function getTimeOfDate(stringDate, stringHour = false) {
  const d = new Date;
  stringDate = stringDate.split('-');
  d.setFullYear(stringDate[0], stringDate[1]-1, stringDate[2]);

  if (stringHour) {
    d.setHours(stringHour, 0, 0, 0);
  } else {
    d.setHours(0, 0, 0, 0);
  }

  return d.getTime();
}


/**
 * check Module data validation & get Error list
 * @param {string} moduleName
 * @param {object} moduleData
 * @return {object}
 */
function checkModuleDataValidationAndGetErrorList(moduleName, moduleData) {
  const errors = {};
  switch (moduleName) {
    case 'create_journey':
      ['from', 'to', 'start', 'startTime', 'personCount'].forEach( (el) => {
        if (typeof moduleData[el] == 'undefined' ||
        moduleData[el].trim() == '') {
          errors[el] = `Given value is invalid!`;
        }
      });
      if (! Number.isInteger(parseInt(moduleData.personCount)) ||
      parseInt(moduleData.personCount) <= 0) {
        // eslint-disable-next-line max-len
        errors.personCount = 'Given value is invalid, it should be only numbers and more then 1!';
      }
      if (typeof moduleData.backJourney == 'undefined' ||
      ! (moduleData.backJourney == 'yes' || moduleData.backJourney == 'no')) {
        errors.backJourney = 'please select to create back way journey or not';
      }
      const dateErr = isDateValid(moduleData.start);
      if (dateErr.length > 0) {
        errors.start = dateErr.join(',');
      } else if (getTimeOfDate(
          moduleData.start, moduleData.startTime,
      ) < Date.now()) {
        errors.startTime = 'Given time is expired!';
      }
      break;
  }

  return errors;
}


/**
 * read checking error report
 * @param {checkModuleDataValidationAndGetErrorList} errorReport
 * @return {boolean}
 */
function readCheckingErrorReport(errorReport) {
  return Object.keys(errorReport).length == 0;
}

/**
 * get error template
 * @param {object} errors
 * @return {object}
 */
function getErrorTemplate(errors) {
  return {
    'response_action': 'errors',
    'errors': errors,
  };
}

/**
 * get Date by time
 * @param {Integer} givenTime
 * @param {Boolean} withMinutes
 * @return {String}
 */
function getDateByTime(givenTime, withMinutes = false) {
  const d = new Date(givenTime);
  // eslint-disable-next-line max-len
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} | ${d.getHours()}:${withMinutes ? d.getMinutes() : '00'}`;
}


/**
 * generate single journey from template
 * @param {String} moduleName
 * @param {Object} journeyInfo
 * @return {singleJourneyTemplate}
 */
async function generateSingleJourneyFromTemplate(moduleName, journeyInfo) {
  let singleJourneyTemplate = getViewContent('singleJourney')
      .replace('{{users}}', await journeyInfo.joins.map((singleJoin) => {
        if (singleJoin.slack_id.startsWith(':')) return 'WorkSpace Admin';
        return `<https://app.slack.com/team/${singleJoin.slack_id}|${singleJoin.realName}>`;
      }).join(', '))
      .replace('{{journey_from}}', journeyInfo.from_location)
      .replace('{{journey_to}}', journeyInfo.to_location)
      .replace('{{journey_date}}', getDateByTime(journeyInfo.time))
      .replace('{{journey_personCount}}', journeyInfo.person_count)
      .replace('{{journey_joins}}', journeyInfo.joins.length)
      .replace('{{block_id}}', journeyInfo.journeyID)
      .replace('{{journey_owner}}', (journeyInfo.slack_id.startsWith(':') ? 'WorkSpace Admin' : `<https://app.slack.com/team/${journeyInfo.slack_id}|${journeyInfo.slack_realname}>`));

  if (moduleName == 'load_created_journey') {
    singleJourneyTemplate = singleJourneyTemplate.replace('{{join_button}}',
        getViewContent('joinButton'))
        .replace('{{name}}', 'Delete journey')
        .replace('{{color}}', 'danger')
        .replace('{{join_leave}}', 'delete')
        .replace('{{journey_id}}', journeyInfo.journeyID);
  } else if (moduleName == 'load_exists_journey') {
    singleJourneyTemplate = singleJourneyTemplate
        .replace('{{join_button}}', getViewContent('joinButton'))
        .replace('{{name}}', 'Join')
        .replace('{{color}}', 'danger')
        .replace('{{join_leave}}', 'join')
        .replace('{{journey_id}}', journeyInfo.journeyID);
  } else if (moduleName == 'load_joined_journey') {
    singleJourneyTemplate = singleJourneyTemplate
        .replace('{{join_button}}', getViewContent('joinButton'))
        .replace('{{name}}', 'Leave')
        .replace('{{color}}', 'danger')
        .replace('{{join_leave}}', 'leave')
        .replace('{{journey_id}}', journeyInfo.journeyID);
  }

  return singleJourneyTemplate;
}


/**
 * sort User by journey
 * @param {Array} allJoins
 * @return {Object}
 */
function sortUserByJourney(allJoins) {
  const journeys = [];

  allJoins.forEach((join) => {
    if (journeys[join.journeyID] == undefined) {
      journeys[join.journeyID] = join;
      journeys[join.journeyID].creatorRealName = join.slack_realname;
      journeys[join.journeyID]['joins'] = [];
    }

    if ( ! journeys[join.journeyID]['joins'].some(
        (journeyMember) => journeyMember.slack_id == join.joinedUser,
    )) {
      journeys[join.journeyID]['joins'].push({
        slack_id: join.joinedUser,
        realName: join.slack_realname,
        join_at: join.join_time,
      });
    }
  });


  return journeys.filter((item) => item != null);
}


/**
 * send notification to message tab
 * @param {String} userID
 * @param {String} message
 * @return {void}
 */
function sendNotificationToMessageTab(userID, message) {
  api.callApiPost('chat.postMessage',
      {as_user: true, channel: userID, text: message});
}


/**
 * showInformationBox
 * @param {Respone} res instance of Responce Object
 * @param {String} triggerID
 * @param {String} viewID
 * @param {String} message
 * @return {void}
 */
async function showInformationBox(res, triggerID, viewID, message) {
  if (triggerID.trim() != '' && viewID.trim() != '') {
    await api.callApiPost('views.update',
        {trigger_id: triggerID, view_id: viewID,
          view: (await getViewContent('alertModule'))
              .replace('{{message}}', message),
        });
  } else {
    res.send({
      'response_action': 'update',
      'view': (await getViewContent('alertModule'))
          .replace('{{message}}', message),
    });
  }
}


/**
 * delete message module
 * @param {String} triggerID
 * @param {String} viewID
 * @param {Number} journeyID
 */
async function deleteMessageModule(triggerID, viewID, journeyID) {
  if (triggerID.trim() != '' && viewID.trim() != '') {
    await api.callApiPost('views.update',
        {trigger_id: triggerID, view_id: viewID,
          view: (await getViewContent('deleteMessageModule'))
              .replace('{{journey_id}}', journeyID),
        });
  }
}


/**
 * back journey response
 * @param {Object} oldJourneyInfo
 * @param {String} triggerID
 * @param {String} viewID
 * @return {Api}
 */
async function backJourneyResponse(oldJourneyInfo, triggerID, viewID) {
  const currentDate = new Date(Date.now());
  return await api.callApiPost('views.open',
      {trigger_id: triggerID, view_id: viewID,
        view: (await getViewContent('createBackJourney'))
            .replace('{{from}}', oldJourneyInfo.to)
            .replace('{{to}}', oldJourneyInfo.from)
            .replace('{{date}}', oldJourneyInfo.start)
            .replace('{{time}}', oldJourneyInfo.startTime + ':00')
            .replace('{{personCount}}', oldJourneyInfo.personCount)
            .replace('{todayDate}',
                // eslint-disable-next-line max-len
                `${currentDate.getFullYear()}-${currentDate.getMonth()+1}-${currentDate.getDate()}`),
      });
}


/**
 * fetch info from static text
 * @param {String} blockId
 * @param {Object} allBlocks
 * @return {null}
 */
function fetchInfoFromStaticText(blockId, allBlocks) {
  let block = allBlocks.filter((item) => {
    if (item.block_id === blockId) return item;
  });
  block = block[0].elements[0].text
      .replace('*From :*', '')
      .replace('*To :*', '')
      .replace('*People Count :*', '')
      .trim();

  return block;
}

module.exports = {
  getEventInfo, getViewContent, displayHome, getBlocksID,
  getModuleTitle, fetchDataViaBlocksId,
  checkModuleDataValidationAndGetErrorList,
  readCheckingErrorReport, getErrorTemplate,
  getTimeOfDate, generateSingleJourneyFromTemplate,
  sortUserByJourney, sendNotificationToMessageTab,
  showInformationBox, isDateValid, deleteMessageModule,
  getDateByTime, displayError, backJourneyResponse, fetchInfoFromStaticText};
