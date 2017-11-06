import getVoterInfo from '../src/scraper/getVoterInfo';

test('check VoterInfo', async () => {
  // Non existent voter id
  // const voter = await getVoterInfo('18821204');

  // existent voter id
  const voter = await getVoterInfo('17567458');
  console.log(voter);
});
