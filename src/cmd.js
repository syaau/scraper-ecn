#!/usr/bin/env node

import program from 'commander';
import getDistricts from './scraper/getDistricts';
import getLocalBodies from './scraper/getLocalBodies';
import getWards from './scraper/getWards';
import getCenters from './scraper/getCenters';

import scrape from './scrape.js';

program
  .version('1.0.0')
  .option('-d, --district [id]', 'District')
  .option('-l, --local-body [id]', 'Local Body')
  .option('-w, --ward [number]', 'Wards')
  .option('-c, --center [id]', 'Voting Center')
  .option('--detail', 'Detail')
  .parse(process.argv);

async function main() {
  if (!program.district) {
    const districts = await getDistricts();
    districts.forEach((district) => {
      console.log(district.id, district.name);
    });

    program.outputHelp();
    console.log('Provide a district id with -d. Check available districts above');

    return;
  }

  if (!program.localBody) {
    const localBodies = await getLocalBodies(program.district);
    localBodies.forEach((body) => {
      console.log(body.id, body.name);
    });
    console.log('Provide a local body id with -l.');
    return;
  }

  if (!program.ward) {
    const wards = await getWards(program.localBody);
    console.log(wards.map(w => w.number).join(', '));
    console.log('Provide a ward number with -w.');
    return;
  }

  if (!program.center) {
    const centers = await getCenters(program.localBody, program.ward);
    centers.forEach((center) => {
      console.log(center.id, center.name);
    });
    console.log('Provide voting center id wth -c.');
    return;
  }

  if(!program.detail) {
    // Do only first level scraping
    console.log('Performing first level scraping');
    scrape(0, program.district, program.localBody, program.ward, program.center);
  } else {
    // Do detail scraping
    console.log('Performing detail scraping');
    scrape(1, program.district, program.localBody, program.ward, program.center);
  }
}

main();
