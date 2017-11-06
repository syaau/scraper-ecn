const cheerio = require('cheerio');
const request = require('request-promise-native');
const centers = require('./centers.json');
const fs = require('fs');

function pullVoters({ districtId, vdcId, ward, id }) {
  // if the voters file has already been created then skip the step
  const file = `voters/${districtId}/${id}.json`;
  if (fs.existsSync(file)) {
    const size = JSON.parse(fs.readFileSync(file, 'utf8')).length;
    if (size > 0) {
      return Promise.resolve(size);
    }
  }

  console.log(`Getting voters for ${districtId} ${id}`);
  return request.post('http://202.166.205.141/bbvrs/view_ward.php').form({
    district: districtId,
    vdc_mun: vdcId,
    ward: ward,
    reg_centre: id,
    hidVdcType: 'mun',
  }).then((data) => {
    $ = cheerio.load(data);
    const res = [];
    $('table#tbl_data tbody tr').each(function() {
      const cells = $(this).find('td');
      const sn = cells.eq(0).text();
      const voterNo = cells.eq(1).text();
      const name = cells.eq(2).text();
      const sex = cells.eq(3).text();
      const father = cells.eq(4).text();
      const mother = cells.eq(5).text();

      res.push({
        sn, voterNo, name, sex, father, mother
      });
    });

    if (res.length === 0) {
      throw new Error(`No voters found in center ${id} of district ${districtId} vdc ${vdcId} ward ${ward}`);
    }

    // Make sure the district folder is there
    createFolder(districtId);

    // Now write the file
    fs.writeFileSync(file, JSON.stringify(res), { encoding: 'utf8' });
    return res.length;
  });
}

function createFolder(district) {
  if (!fs.existsSync('voters')) {
    fs.mkdirSync('voters');
  }

  const folder = `voters/${district}`;
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder);
  }

  return folder;
}

const concurrent = 16;
let idx = 0;
let completed = 0;
let processes = 0;
let totalVoters = 0;

function process() {
  while (idx < centers.length && processes < concurrent) {
    const center = centers[idx];
    processes += 1;
    idx += 1;

    pullVoters(center).then((count) => {
      totalVoters += count;
      completed += 1;
      processes -= 1;
      // console.log(`${completed}/${centers.length} Completed with ${count} voters. Total voters: ${totalVoters}`);
      process();
    }).catch((err) => {
      console.log('ERROR', err.message);
      processes -= 1;
      process();
    });
  }
}

function count() {
  let c = 0;
  let total = 0;

  for (let i = 0; i < centers.length; i += 1) {
    const file = `voters/${centers[i].districtId}/${centers[i].id}.json`;
    if (fs.existsSync(file)) {
      c += 1;
      total += JSON.parse(fs.readFileSync(file, "utf8")).length;
    }
  }

  console.log(`Total centers ${c}/${centers.length}. Total registered voters ${total}`);
}

process();
// count();
// console.log('Total voter count', totalVoters);
// getVoters(centers[0]).then(console.log);