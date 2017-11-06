import getOptions from './_getOptions';

export default async function getWards(localBodyId) {
  const options = await getOptions({
    list_type: 'ward',
    vdc: localBodyId,
  });

  return options.map(o => ({
    number: o.name,
    localBodyId,
  }));
}
