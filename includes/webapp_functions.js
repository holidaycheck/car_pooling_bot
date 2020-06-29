const db = require('./db');

/**
 * isLogin
 * @param {String} request
 * @return {Boolean}
 */
function isLogin(request) {
  return request.session.loggedin == true;
}

/**
 * load journey information with journey members via ine SQL call
 * @param {String} journeyUUID
 * @param {String} workspaceId
 * @return {JourneyInfoWithMembers}
 */
function loadJourneyInfoWithMembers(journeyUUID, workspaceId) {
  return new Promise((resolve, reject) => {
    db.query(`select j.id as journeyID, j.uuid, j.create_time, o.join_time,
    o.user as joinedUser, j.user as journeyCreator,
      j.from_location, j.to_location, j.start_date, j.time,
      j.person_count, u.slack_id, u.slack_realname
      from joins o 
      inner join users u on o.user = u.slack_id 
      inner join journeys j on j.id = o.journey 
      where j.uuid = ? and o.workspace = ?`,
    [journeyUUID, workspaceId], (error, results) => {
      if (error) {
        reject(error);
        console.log(error);
        return;
      }
      resolve(results);
    });
  });
}


/**
 * get Journey Owner from joins list
 * @param {Array<Object>} joinsList
 * @return {String}
 */
function getJourneyOwnerFromJoinsList(joinsList) {
  return joinsList[0].realName;
}

module.exports = {
  isLogin, loadJourneyInfoWithMembers,
  getJourneyOwnerFromJoinsList,
};
