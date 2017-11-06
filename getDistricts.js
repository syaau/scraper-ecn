const fs = require('fs');
const cheerio = require('cheerio');

function remoteGet() {

}

function testGet() {
  return new Promise((resolve, reject) => {
    fs.readFile("./districts.html", "utf-8", (err, data) => {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}

const getData = testGet;

function getDistricts() {
  return getData().then(data => {
    const $ = cheerio.load(data);
    const all = [];
    $('select#district option').each(function(index) {
      const elem = $(this);
      const id = elem.attr('value');
      if (id === '') {
        return;
      }

      all.push({
        id,
        name: elem.text(),
      });
    });
    all.sort((a, b) => (a.id - b.id));
    return all;
  });
}

// Save the districts on a json file
getDistricts().then((result) => {
  fs.writeFileSync('districts.json', JSON.stringify(result));
});

module.exports = getDistricts();