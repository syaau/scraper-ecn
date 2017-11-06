import request from 'request-promise-native';
import cheerio from 'cheerio';
import { getUrl } from './config';

const dataRowMap = {
  formNo: 0,
  name: 1,
  englishName: 2,
  dob: 3,
  sex: 4,
  citizenship: 5,
  father: 6,
  mother: 7,
  spouse: 8,
  state: 9,
  district: 10,
  regionHoR: 11,
  regionProvince: 12,
  localBody: 13,
  ward: 14,
  center: 15,
};

export default async function getVoterInfo(voterId) {
  const data = await request.post(getUrl('personal_details.php'), { gzip: true }).form({
    strFormNo: voterId, // The form number of the voter
    strResult: `'OR form_no='${voterId}`, // SQL injection (value supposed to be DOB or citizenship num)
    rbOption: '1',      // '1' to check for dob '2' to check by citizenship num
  });

  // console.log(data);

  const $ = cheerio.load(data);
  const rows = $('table.bbvrs_sel table tr');
  if (rows.length < 17) {
    throw new Error('Record not found');
  }

  const res = Object.keys(dataRowMap).reduce((res, key) => ({
    ...res,
    [key]: rows.eq(dataRowMap[key]).find('td').eq(1).text(),
  }), {});

  const img = $('table.bbvrs_sel table img').attr('src');
  const pos = img.indexOf(',') + 1;
  const imgData = Buffer.from(img.substring(pos), 'base64');

  res.image = imgData;
  return res;
}