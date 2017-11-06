import getOptions from './_getOptions';

export default async function getCenters(localBodyId, ward) {
  const options = await getOptions({
    list_type: 'reg_centre',
    vdc: localBodyId,
    ward,
  });

  return options.map(o => ({
    ...o,
    localBodyId,
    ward,
  }));
}
