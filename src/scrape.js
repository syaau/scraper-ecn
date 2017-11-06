import path from 'path';
import fs from 'fs';
import glob from 'glob';

import getVoterList from './scraper/getVoterList';
import getVoterInfo from './scraper/getVoterInfo';

function createFolders(folder) {
  const folders = folder.split('/');

  return folders.reduce((d, name) => {
    const f = path.resolve(d, name);
    if (!fs.existsSync(f)) {
      fs.mkdirSync(f);
    }
    return f;
  }, path.resolve('.'));
}

// Make sure there are no more than the given requests at a time
const MAX_CONCURRENT = 32;
let requestCount = 0;
let requests = [];

function getDetailInfo(voterId) {
  return new Promise((resolve) => {
    const execute = () => {
      requestCount += 1;
      getVoterInfo(voterId).then((info) => {
        requestCount -= 1;

        // Run any queued requests
        if (requests.length > 0) {
          requests.shift()();
        }
        resolve(info);
      });
    }

    if (requestCount >= MAX_CONCURRENT) {
      requests.push(execute);
    } else {
      execute();
    }
  });
}

export default async function scrape(level, districtId, localBodyId, wardNo, centerId) {
  const folder = createFolders(`voters/${districtId}/${centerId}`);

  if (level === 0) {
    const voters = await getVoterList(districtId, localBodyId, wardNo, centerId);
    voters.forEach((voter) => {
      const f = path.resolve(folder, `${voter.id}.json`);
      if (!fs.existsSync(f)) {
        fs.writeFileSync(f, JSON.stringify(voter));
      }
    });
  } else {
    // Get the list of voters from file system
    return new Promise((resolve, reject) => {
      glob('*.json', { cwd: folder }, (err, files) => {
        if (err) {
          return reject(err);
        }

        let remainingFiles = files.length;
        console.log('Checking', remainingFiles, 'voters');
        files.forEach(async (file) => {
          const f = path.resolve(folder, file);
          const id = file.substring(0, file.length - 5);

          const img = path.resolve(folder, `${id}.jpg`);
          // Check if detail has already been retrieved
          if (fs.existsSync(img)) {
            console.log('Skipping', id);
            return;
          }

          // Get the detail info, and update the file
          const { image, ...voter } = await getDetailInfo(id);
          fs.writeFileSync(f, JSON.stringify(voter));
          fs.writeFileSync(img, image);

          remainingFiles -= 1;
          if (remainingFiles === 0) {
            resolve(true);
          }
        });
      });
    });
  }
}