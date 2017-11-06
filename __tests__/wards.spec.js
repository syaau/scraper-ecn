import getWards from '../src/scraper/getWards';

test('Check wards', async () => {
  const data = await getWards(5001);
  expect(data.length).toBeGreaterThan(1);
  console.log(data);
});
