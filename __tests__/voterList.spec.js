import getVoterList from '../src/scraper/getVoterList';

test('Check voter list', async () => {
  const voters = await getVoterList(44, 5455, 2, 4803);
  expect(voters.length).toBeGreaterThan(1000);
  console.log(voters[0]);
});
