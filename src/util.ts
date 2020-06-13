import { isArray, isUndefined } from 'is-all-utils';
export const _ignoreNil = (v: any) => (isUndefined(v) ? '_ignoreNil' : v);
export const objIterate = (obj: More, fn: Function) => {
   let payload = {};
   for (const [key, value] of Object.entries(obj)) {
      let newKey = key;
      let newValue = value;

      const dataReturn = fn(value, key);

      if (dataReturn === '_ignoreNil') {
         continue;
      } else if (isArray(dataReturn) && dataReturn.length === 2) {
         newValue = dataReturn[0];
         newKey = dataReturn[1];
      } else {
         newValue = dataReturn;
      }

      payload[newKey] = newValue;
   }
   return payload;
};
