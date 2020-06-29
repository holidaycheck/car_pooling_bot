const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const db = require('../includes/db');
const crypto = require('crypto');

router.get('/', (req, res) => {
  res.render('login', {pageTitle: 'Login'});
});


router.post('/', (req, res) => {
  const errors = [];
  const workspaceDomain = req.body.domain;
  let workspacePassword = req.body.password;

  if (workspaceDomain == '' || workspacePassword == '') {
    errors.push('The Workspace Domain and password can not be empty');
  }

  if (errors.length == 0) {
    // there is no error
    workspacePassword = crypto.createHash('md5')
        .update(workspacePassword).digest('hex');
    db.query('select * from workspaces where domain = ? and password = ?',
        [workspaceDomain, workspacePassword], (error, results) => {
          if (error) {
            console.log(error);
            return;
          }
          if (results.length > 0) {
            req.session.loggedin = true;
            req.session.userinfo = results[0];
            res.redirect('./');
          } else {
            res.render('login', {pageTitle: 'Login',
              // eslint-disable-next-line max-len
              errors: ['the given domain and password is not exists in the database']});
          }
        });
  } else { // there is errors, let's display it
    res.render('login', {pageTitle: 'Login', errors: errors});
  }
});


module.exports = router;
