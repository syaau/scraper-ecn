import getOptions from './_getOptions';

export default async function getLocalBodies(districtId) {
  const options = await getOptions({
    list_type: 'vdc',
    district: districtId,
  });

  return options.map(o => ({
    ...o,
    districtId,
  }));
}
