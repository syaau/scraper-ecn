
const request = require('request-promise-native');
const cheerio = require('cheerio');
const sqlite3 = require('sqlite3');
const fs = require('fs');
const Buffer = require('buffer').Buffer;

const allCenters = require('./centers.json');

const district = process.argv[2];
if (!district) {
  console.log('No district provided');
  process.exit(0);
}

const centers = allCenters.filter(center => center.districtId == district);

function getVoterInfo(voterId) {
  return request.post('http://202.166.205.141/bbvrs/personal_details.php', { gzip: true }).form({
    strFormNo: voterId, // The form number of the voter
    strResult: `'OR form_no='${voterId}`, // SQL injection (value supposed to be DOB or citizenship num)
    rbOption: '1',      // '1' to check for dob '2' to check by citizenship num
  }).then((data) => {
    // <div class='err_msg'>ERROR: No record Exists</div>
    if (data === '<div class=\'err_msg\'>ERROR: No record Exists</div>') {
      return Promise.reject(`Record not found for ${voterId}`);
    }
    
    const $ = cheerio.load(data);
    if ($('div.err_msg').text() === 'ERROR: No record Exists') {
      return Promise.reject(`Record not found for ${voterId}`);
    }
    
    const res = {};
    $('table.bbvrs_sel table tbody').each(function() {
      const rows = $(this).find('tr');
      res.formNo = rows.eq(0).find('td').eq(1).text();
      res.name = rows.eq(1).find('td').eq(1).text();
      res.englishName = rows.eq(2).find('td').eq(1).text();
      res.dob = rows.eq(3).find('td').eq(1).text();
      res.sex = rows.eq(4).find('td').eq(1).text();
      res.citizenship = rows.eq(5).find('td').eq(1).text();
      res.father = rows.eq(6).find('td').eq(1).text();
      res.mother = rows.eq(7).find('td').eq(1).text();
      res.spouse = rows.eq(8).find('td').eq(1).text();
      res.district = rows.eq(9).find('td').eq(1).text();
      res.municipal = rows.eq(10).find('td').eq(1).text();
      res.ward = rows.eq(11).find('td').eq(1).text();
      res.tole = rows.eq(12).find('td').eq(1).text();
      res.center = rows.eq(13).find('td').eq(1).text();
    });

    const img = $('table.bbvrs_sel table img').attr('src');
    
    const pos = img.indexOf(',') + 1;
    const imgData = img.substring(pos);
    const jpgData = Buffer.from(imgData, 'base64');
    const imgFile = `images/${voterId}.jpg`;
    fs.writeFileSync(imgFile, jpgData);

    return res;
  });
}

//  First initialize the db
const dbFile = `voters.${district}.sqlite.db`;
console.log('Opening db file', dbFile);
const db = new sqlite3.Database(dbFile);
db.serialize(function() {
  // Create the tables if not already created
  db.run("CREATE TABLE IF NOT EXISTS center (id TEXT PRIMARY KEY, name TEXT, district TEXT, municipal TEXT, ward TEXT);");
  db.run(`CREATE TABLE IF NOT EXISTS voter(
    id TEXT PRIMARY KEY,
    name TEXT,
    english TEXT,
    dob TEXT,
    sex TEXT,
    citizenship TEXT,
    father TEXT,
    mother TEXT,
    spouse TEXT,
    center TEXT);`);
});

const APPROX_TOTAL = 18050000/75;

const concurrent = 32;
let processing = 0;

let count = 0;    // The number of records processed so far
let idx = 0;
const totalLoops = centers.length;

// Show a progress report every 10 seconds
let lastCount = 0;
let lastTimestamp = Date.now();
setInterval(function() {
  const diff = count - lastCount;
  const interval = Date.now() - lastTimestamp;
  const speed = diff * 1000 / interval;
  const remaining = (APPROX_TOTAL - count) / speed;
  console.log(`Processed ${count} records. Current speed: ${Math.round(speed, 0)} records/second. Approx time remaining ${Math.round(remaining, 0)} seconds`);
  lastCount = count;
  lastTimestamp = Date.now();
}, 10000);

function scan(center) {
  // First check if the center has been processed, in which case
  // no need to do anything
  db.get("SELECT id FROM center WHERE id=?", center.id, function(err, row) {
    const file = `voters/${center.districtId}/${center.id}.json`;
    const voters = JSON.parse(fs.readFileSync(file, 'utf8'));

    if (row !== undefined) {
      // This center is already done, end this process
      // increase the count by the bulk
      console.log('Done with center', center.id);
      count += voters.length;
      endMain();
      return;
    }

    // Read the center file
    //console.log(voters);
    processVoter(center, voters, 0);
  });
}

function processVoter(center, voters, index) {
  if (index >= voters.length) {
    // We have reached the end, time to end the process, also insert a record for the center, marking its done
    db.run(`INSERT INTO center(id, name, district, municipal, ward)
                              VALUES(?, ?, ?, ?, ?);`,
    center.id, center.name, center.districtId, center.vdcId, center.ward);
    //s.finalize();

    endMain();
    return;
  }

  const voter = voters[index];
  db.get("SELECT * FROM voter WHERE id=?;", voter.voterNo, function (err, row) {
    if (row !== undefined) {
      // I had found some repeating form numbers, just make sure that this is not one of them
      if (row.name !== voter.name && row.father !== voter.father && row.mother !== voter.mother && row.sex !== voter.sex) {
        // We are talking about different voter for same form id, log this error
        console.error('Duplicate form no', row, voter);
      }

      // Already processed, no need to fetch
      count += 1;
      return processVoter(center, voters, index + 1);
    }

    // Fetch data
    getVoterInfo(voter.voterNo).then(v => {
      // insert a record
      db.run(`INSERT INTO voter(id, name, english, father, mother, spouse, sex, dob, citizenship, center)
                              VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          v.formNo, v.name, v.englishName, v.father, v.mother, v.spouse, v.sex, v.dob, v.citizenship, center.id);

      count += 1;
      processVoter(center, voters, index + 1);
    }).catch(err => {
      console.error('Error while fetching data for', voter, err);
    });
  });
}

function endMain() {
  processing -= 1;
  // See if there's anything remaining to be done
  if (idx === totalLoops) {
    // everything finished
    // Can't close the database just yet, other process might be running
    // db.close();
  } else {
    // Continue with another process
    main();
  }
}

function main() {
  while (idx < totalLoops && processing < concurrent) {
    const center = centers[idx];
    idx += 1;
    processing += 1;

    db.serialize(function() {
      scan(center);
    });
  }
}

main();

// getVoterInfo('18821204').then(console.log).catch(console.error);
// getVoterInfo('17567458').then(console.log);
