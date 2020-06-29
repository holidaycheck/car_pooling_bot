const db = require('./db');


/**
 * insert new user if not exists
 * @param {Object} slackUserInfo
 * @param {CallableFunction} ifNotExistsCallback
 * @param {CallableFunction} ifExistsCallback
 */
function insertNewUserIfNotExists(slackUserInfo, ifNotExistsCallback,
    ifExistsCallback) {
  db.query('SELECT * FROM users WHERE slack_id = ?',
      [slackUserInfo.id], (error, selectResults) => {
        if (error) {
          console.log(error);
          return;
        }
        if (selectResults.length == 0) {
          // eslint-disable-next-line max-len
          db.query('INSERT INTO users (slack_id, slack_email, slack_name, slack_realname, workspace) VALUES (?, ?, ?, ?, ?)',
              [slackUserInfo.id, slackUserInfo.profile.email,
                slackUserInfo.name, slackUserInfo.real_name,
                slackUserInfo.team_id],
              (err, insertResults) => {
                if (err) {
                  console.log(error);
                }
                ifNotExistsCallback(insertResults);
              });
        } else {
          ifExistsCallback(selectResults);
        }
      });
}


/**
 * insert new workspace if not exists
 * @param {Object} workspaceInfo
 * @param {CallableFunction} ifNotExistsCallback
 * @param {CallableFunction} ifExistsCallback
 * @return {void}
 */
function insertNewWorkspaceIfNotExists(workspaceInfo) {
  return new Promise((resolve, reject) => {
    db.query('SELECT * FROM workspaces WHERE workspace_id = ?',
        [workspaceInfo.id], (error, selectResults) => {
          if (error) {
            reject(new Error({errorType: 'MySql',
              errorMessage: 'Error in mysql connection'}));
          }
          if (selectResults.length == 0) {
            // eslint-disable-next-line max-len
            db.query('INSERT INTO workspaces (domain, workspace_id, active) VALUES (?, ?, ?)',
                [workspaceInfo.domain, workspaceInfo.id, 1],
                (err, insertResults) => {
                  if (err) {
                    console.log(error);
                    reject(err);
                  }
                  resolve({isExists: false, data: insertResults});
                });
          } else {
            resolve({isExists: true, data: selectResults});
          }
        });
  });
}


/**
 * create new journey
 * @param {Object} journeyInfo
 * @param {CallableFunction} errorCallback
 * @param {CallableFunction} successCallback
 */
function createNewJourney(journeyInfo, errorCallback, successCallback) {
  // eslint-disable-next-line max-len
  db.query('INSERT INTO journeys (uuid, user, from_location, to_location, start_date, time, person_count, create_time, workspace) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        journeyInfo.uuid, journeyInfo.user, journeyInfo.from_location,
        journeyInfo.to_location, journeyInfo.start_date, journeyInfo.time,
        journeyInfo.person_count, journeyInfo.create_time,
        journeyInfo.workspace,
      ],
      (err, insertResults) => {
        if (err) {
          errorCallback(err);
          return;
        }
        successCallback(insertResults);
      });
}


/**
 * get journey members
 * @param {String} journeyID
 * @param {CallableFunction} errorCallback
 * @param {CallableFunction} successCallback
 */
function getJourneyMembers(journeyID, errorCallback, successCallback) {
  // eslint-disable-next-line max-len
  db.query(`select j.id, u.slack_id, u.slack_realname from joins j inner join users u on u.slack_id = j.user where journey = ?`,
      journeyID, async (error, results) => {
        if (error) {
          errorCallback(error);
          return;
        }
        await successCallback(results);
      });
}


/**
 * load exists journey
 * @param {String} moduleName
 * @param {String} workspaceID
 * @param {String} user
 * @param {Integer} timeNow
 * @param {CallableFunction} errorCallback
 * @param {CallableFunction} successCallback
 */
function loadExistsJourney(moduleName, workspaceID, user,
    timeNow, errorCallback, successCallback) {
  let sql;
  let dataForSql = [timeNow, workspaceID, user];
  if (moduleName == 'admin_panel') {
    dataForSql = [workspaceID];
  }
  switch (moduleName) {
    case 'load_exists_journey':
    case 'load_joined_journey':

      // eslint-disable-next-line max-len
      sql = `select j.id as journeyID, o.user as joinedUser, j.user as journeyCreator,
      j.from_location, j.to_location, j.start_date, j.time, j.person_count,
      u.slack_id, u.slack_realname
      from joins o 
      inner join users u on o.user = u.slack_id 
      inner join journeys j on j.id = o.journey 
      where j.time > ? and o.workspace = ? and j.user != ? order by j.time asc`;

      break;

    case 'load_created_journey':

      sql = `select j.id as journeyID, o.user as joinedUser,
      j.user as journeyCreator,
        j.from_location, j.to_location, j.start_date, j.time,
        j.person_count, u.slack_id, u.slack_realname
        from joins o 
        inner join users u on o.user = u.slack_id 
        inner join journeys j on j.id = o.journey 
        where j.time > ? 
        and o.workspace = ? and j.user = ? order by j.time asc`;

      break;

    case 'admin_panel':

      sql = `select j.id as journeyID, j.uuid as journeyUUID,
      o.user as joinedUser, j.user as journeyCreator,
        j.from_location, j.to_location, j.start_date, j.time,
        j.person_count, u.slack_id, u.slack_realname
        from joins o 
        inner join users u on o.user = u.slack_id 
        inner join journeys j on j.id = o.journey 
        where o.workspace = ? order by j.time asc`;

      break;

    default:
      break;
  }

  db.query(sql, dataForSql,
      (error, results) => {
        if (error) {
          errorCallback(error);
          return;
        }
        successCallback(results);
      });
}


/**
 * join journey
 * @param {Integer} journeyID
 * @param {String} user
 * @param {String} workspaceID
 * @param {CallableFunction} errorCallback
 * @param {CallableFunction} successCallback
 */
function joinJourney(journeyID, user, workspaceID,
    errorCallback, successCallback) {
  // eslint-disable-next-line max-len
  db.query('INSERT INTO joins (journey, user, join_time, workspace) VALUES (?, ?, ?, ?)', [journeyID, user, Date.now(), workspaceID], (error, result) => {
    if (error) {
      errorCallback(error);
      return;
    }
    successCallback(result);
  });
}


/**
 * remove user from journey
 * @param {Integer} journey
 * @param {String} user
 * @param {CallableFunction} errorCallback
 * @param {CallableFunction} successCallback
 */
function removeUserFromJourney(journey, user, errorCallback, successCallback) {
  db.query('delete from joins where user = ? and journey = ?',
      [user, journey], (error, result) => {
        if (error) {
          errorCallback(error);
          return;
        }
        successCallback(result);
      });
}


/**
 * get journey owner
 * @param {Integer} journeyID
 * @param {CallableFunction} errorCallback
 * @param {CallableFunction} successCallback
 */
function getJourneyOwner(journeyID, errorCallback, successCallback) {
  db.query('select * from journeys where id = ?',
      [journeyID], (error, result) => {
        if (error) {
          errorCallback(error);
          return;
        }
        successCallback(result);
      });
}


/**
 * delete journey
 * @param {Integer} journeyID
 */
function deleteJourney(journeyID) {
  db.query('delete from joins where journey = ?',
      [journeyID], (error, results) => {
        if (error) {
          console.log(error);
          return;
        }

        db.query('delete from journeys where id = ?',
            [journeyID], (error, results) => {
              if (error) {
                console.log(error);
                return;
              }
            });
      });
}


/**
 * get journey information
 * @param {Integer} journeyID
 * @param {Boolean} isUUID
 * @param {CallableFunction} errorCallback
 * @param {CallableFunction} successCallback
 */
function getJourneyInfo(journeyID, isUUID, errorCallback, successCallback) {
  db.query(`select j.id, j.from_location, j.to_location,
  u.slack_id as user_slackID,
  u.slack_realname as user_realName, j.time
  from journeys j inner join users u on u.slack_id = j.user
  where ` + (isUUID ? `j.uuid = ?` : `j.id = ?`),
  [journeyID, journeyID], (error, results) => {
    if (error) {
      errorCallback(error);
      return;
    }
    successCallback(results);
  });
}


/**
 * update workspace password
 * @param {String} workspaceID
 * @param {MD5String} newPassword
 */
function updatePassword(workspaceID, newPassword) {
  db.query('update workspaces set password = ? where workspace_id = ?',
      [newPassword, workspaceID], (error, result) => {});
}

/**
 * load workspace members
 * @param {String} workspaceId
 * @return {Promise}
 */
function loadWorkspaceMembers(workspaceId) {
  return new Promise((resolve, reject) => {
    db.query('select * from users where workspace = ?',
        [workspaceId], (error, results) => {
          if (error) {
            console.log(error);
            reject(error);
            return;
          }
          resolve(results);
        });
  });
}


/**
 * Journeys of members
 * @param {String} slackId
 * @param {String} workspaceId
 * @return {Promise}
 */
function getMemberJourney(slackId, workspaceId) {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line max-len
    db.query('select * from journeys j inner join users u on j.user = u.slack_id where j.user = ? and j.workspace = ?',
        [slackId, workspaceId], (error, results) => {
          if (error) {
            console.log(error);
            reject(error);
            return;
          }
          resolve(results);
        });
  });
}

module.exports = {
  insertNewUserIfNotExists, createNewJourney, loadExistsJourney,
  joinJourney, getJourneyMembers,
  removeUserFromJourney, getJourneyOwner, deleteJourney,
  getJourneyInfo, insertNewWorkspaceIfNotExists, updatePassword,
  loadWorkspaceMembers, getMemberJourney,
};
