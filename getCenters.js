const fs = require('fs');
const cheerio = require('cheerio');
const wards = require('./wards.json');
const getOptions = require('./getOptions');

console.log('Total Wards', wards.length);

function getCenterByWard({ id, vdcId, districtId}) {
  return getOptions({
    list_type: 'reg_centre',
    vdc: vdcId,
    ward: id,
  }).then(res => res.map(o => Object.assign(o, { ward: id, vdcId, districtId })));
}

async function getParts(src) {
  return Promise.all(src.map(getCenterByWard)).then((res) => {
    return res.reduce((acc, r) => acc.concat(r), []);
  });
}

async function process() {
  let all = [];
  // Do in chunks of 29
  for (let i = 0; i < wards.length; i += 20) {
    const parts = wards.slice(i, i + 20);
    const res = await getParts(parts);
    all = all.concat(res);
  }

  console.log('Total centers', all.length);
  fs.writeFileSync('centers.json', JSON.stringify(all), { encoding: 'utf8' });
}

process();


//getWardsByVdc(5278).then(console.log);