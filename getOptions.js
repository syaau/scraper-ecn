const request = require('request-promise-native');
const cheerio = require('cheerio');

module.exports = function (params) {
  return request.post('http://202.166.205.141/bbvrs/index_process.php')
    .form(params)
    .then(res => {
    const $ = cheerio.load(JSON.parse(res).result);
    const result = [];
    $('option').each(function() {
      const elem = $(this);
      const id = elem.attr('value');
      if (!id) {
        return;
      }

      result.push({
        id,
        name: elem.text(),
      });
    });
    return result;
  });
}