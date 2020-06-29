const {getTimeOfDate} = require('../includes/functions');


describe('tests of getTimeOfDate function', () => {
  it('Should return true', () => {
    const currentDate = '2020-05-19';
    const currentTime = getTimeOfDate(currentDate);
    let expected = new Date(Date.now());
    expected.setHours(0, 0, 0, 0);
    expected = expected.getTime();

    expect(currentTime).toBe(expected);
  });
});
