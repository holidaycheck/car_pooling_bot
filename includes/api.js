const axios = require('axios');
const apiUrl = 'https://slack.com/api';

module.exports = {
  callApiPost: async (method, payload) => {
    return await axios.post(`${apiUrl}/${method}`, payload, {
      headers: {
        Authorization: 'Bearer ' + (await require('./slack_token').token)},
    })
        .then((result) => {
          return result.data;
        })
        .catch((error) => {
          console.log(error);
        });
  },
  callApiGet: async (method, payload) => {
    payload.token = (await require('./slack_token').token);
    // console.log(payload); return;
    const params = Object.keys(payload).map(
        (key) => `${key}=${payload[key]}`,
    ).join('&');

    return axios.get(`${apiUrl}/${method}?${params}`)
        .then((result) => {
          return result.data;
        })
        .catch((error) => {
          console.log(error);
        });
  },
};
