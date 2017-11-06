import cheerio from 'cheerio'
import request from 'request-promise-native';

import { getUrl } from './config';

export default async function getDistricts() {
  const data = await request.get(getUrl('index.php'));

  const $ = cheerio.load(data);
  const districts = [];
  $('select#district option').map(function (index) {
    const elem = $(this);
    const id = elem.attr('value');
    if (id === '') {
      return;
    }

    districts.push({
      id,
      name: elem.text(),
    });
  });
  return districts;
}
