import getCenters from '../src/scraper/getCenters';

test('Check centers', async () => {
  const centers = await getCenters(5001, 1);
  expect(centers.length).toBeGreaterThan(0);
  console.log(centers);
})