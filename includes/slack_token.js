const slackToken = {
  token: process.env.SLACK_BOT_TOKEN || '',
  signinSecret: process.env.SLACK_SIGNING_SECRET || '',
};

if (slackToken.token.trim() === '' ||
slackToken.signinSecret.trim() === '') {
  console.log('Slack Token or Slack signing secret is empty');
  return;
}

module.exports = slackToken;
