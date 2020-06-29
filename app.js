const createError = require('http-errors');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const app = express();
// eslint-disable-next-line new-cap
const server = require('http').Server(app);
const middleware = require('./includes/middlewares');

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));


// for cookie
app.use(cookieParser());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({extended: false}));


app.use('/events', middleware.verifySignature, require('./route/events'));
app.use('/actions', middleware.verifySignature, require('./route/actions'));
app.use('/dust', middleware.dustLinkProtection, require('./route/dust'));
app.use('/login', middleware.notAuthUser, require('./route/login'));
app.use('/view', middleware.authUser, require('./route/view'));
app.use('/members', middleware.authUser, require('./route/members'));
app.use('/delete', middleware.authUser, require('./route/delete'));
app.use('/new_journey', middleware.authUser, require('./route/new_journey'));
app.use('/', middleware.authUser, require('./route/index'));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});


// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// for cronJobs
// require('./includes/cronjob');

server.listen(8080);
