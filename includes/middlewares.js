const {isLogin} = require('./webapp_functions');
const signature = require('./verify_signature');

/**
 * authUser Middleware:
 *  it's only for the user who has logged in
 * @param {Request} req
 * @param {Response} res
 * @param {CallableFunction} next
 */
function authUser(req, res, next) {
  if (! isLogin(req) && req.url != '/login') {
    res.redirect('/login');
    return;
  }
  next();
}

/**
 * notAuthUser Middleware:
 *  it's only for the user who has logged in
 * @param {Request} req
 * @param {Response} res
 * @param {CallableFunction} next
 */
function notAuthUser(req, res, next) {
  if (isLogin(req) && req.url == '/login') {
    res.redirect('/');
    return;
  }
  next();
}

/**
 * verify Slack bot signature to check if
 * the request is from slack or not
 * @param {Request} req
 * @param {Response} res
 * @param {CallableFunction} next
 */
function verifySignature(req, res, next) {
  if (! signature.isVerified(req) && ! req.body.type == 'url_verification') {
    res.sendStatus(404);
    return;
  }
  next();
}

/**
 * Dust Link Protection
 * @param {Request} req
 * @param {Response} res
 * @param {CallableFunction} next
 */
function dustLinkProtection(req, res, next) {
  if (req.url == '/_health' || req.url == '/_ready') {
    next();
    return;
  }
  res.redirect('/login');
}

module.exports = {authUser, notAuthUser, verifySignature,
  dustLinkProtection};
