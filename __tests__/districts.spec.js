import getDistricts from '../src/scraper/getDistricts';

test('Check district', async () => {
  const districts = await getDistricts();
  console.log('Districts', districts);
});
