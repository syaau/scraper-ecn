import request from 'request-promise-native';
import cheerio from 'cheerio';
import { getUrl } from './config';

export default async function getVoterList(districtId, localBodyId, ward, centerId) {
  const data = await request.post(getUrl('view_ward.php')).form({
    district: districtId,
    vdc_mun: localBodyId,
    ward: ward,
    reg_centre: centerId,
    hidVdcType: 'mun',
  });

  const $ = cheerio.load(data);
  const voters = $('table#tbl_data tbody tr').map(function() {
    const cells = $(this).find('td');
    return {
      voterNo: cells.eq(1).text(),
      name: cells.eq(2).text(),
      sex: cells.eq(3).text(),
      father: cells.eq(4).text(),
      mother: cells.eq(5).text(),
    };
  });

  return voters;
}
