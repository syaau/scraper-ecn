const fs = require('fs');
const cheerio = require('cheerio');
const vdcs = require('./vdcs.json');
const getOptions = require('./getOptions');

function getWardsByVdc({ id, districtId }) {
  return getOptions({
    list_type: 'ward',
    vdc: id,
  }).then(res => res.map(o => Object.assign(o, { vdcId:id, districtId })));
}

async function getParts(src) {
  return Promise.all(src.map(getWardsByVdc)).then((res) => {
    const wards = res.reduce((acc, r) => acc.concat(r), []);
    return wards;
    // fs.writeFileSync('wards.json', JSON.stringify(wards), { encoding: 'utf8' });
  });
}

async function process() {
  let all = [];
  // Do in chunks of 10
  for (let i = 0; i < vdcs.length; i += 10) {
    const parts = vdcs.slice(i, i + 10);
    const res = await getParts(parts);
    all = all.concat(res);
  }

  fs.writeFileSync('wards.json', JSON.stringify(all), { encoding: 'utf8' });
}

process();


//getWardsByVdc(5278).then(console.log);