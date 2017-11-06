const fs = require('fs');
const cheerio = require('cheerio');
const request = require('request-promise-native');
const districts = require('./districts.json');

function getVdcByDistrict(districtId) {
  return request.post('http://202.166.205.141/bbvrs/index_process.php').form({
    district: districtId,
    list_type: 'vdc',
  }).then(res => {
    const $ = cheerio.load(JSON.parse(res).result);
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
        districtId,
      });
    });
    return vdcs;
  });
}

Promise.all(districts.map((district) => {
  return getVdcByDistrict(district.id);
})).then(res => {
  const vdcs = res.reduce((acc, part) => acc.concat(part), []);
  fs.writeFileSync('vdcs.json', JSON.stringify(vdcs), { encoding: 'utf8' });
});

// getVdcByDistrict(75).then(console.log);
