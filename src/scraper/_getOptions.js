import request from 'request-promise-native';
import cheerio from 'cheerio';
import { getUrl } from './config';

export default async function geOptions(type) {
  const data = await request.post(getUrl('index_process.php')).form(type);

  const $ = cheerio.load(JSON.parse(data).result);
  const vdcs = [];
  $('option').each(function() {
    const elem = $(this);
    const id = elem.attr('value');
    if (!id) {
      return;
    }

    vdcs.push({
      id,
      name: elem.text(),
    });
  });

  return vdcs;
}
