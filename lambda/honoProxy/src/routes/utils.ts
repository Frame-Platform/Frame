export const partition = <T>(array: T[], predicate: (ele: T) => boolean) => {
  const truthy: T[] = [];
  const falsy: T[] = [];

  for (let i = 0; i < array.length; i++) {
    const booleanArray = predicate(array[i]) ? truthy : falsy;
    booleanArray.push(array[i]);
  }
  return [truthy, falsy];
};
