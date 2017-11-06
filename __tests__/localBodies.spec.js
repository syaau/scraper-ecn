import getLocalBodies from '../src/scraper/getLocalBodies';

test('Check localBodies', async () => {
  const bodies = await getLocalBodies(1);
  expect(bodies.length).toBeGreaterThan(0);
  console.log(bodies);
});
