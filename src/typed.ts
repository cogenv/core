import { Moduly, onModuly } from './module';

const toBoolean = (value: any): Boolean => {
   if (typeof value !== 'string') {
      return value;
   }
   switch (value.toLowerCase().trim()) {
      case 'true':
         value = true;
         break;
      case 'false':
         value = false;
         break;
   }

   return value;
};

const toNumber = (value: any): Number => {
   if (!isNaN(parseFloat(value))) {
      value = parseFloat(value);
   }
   return value;
};

const parseTyped = (
   key: string,
   source: string,
   mode = 'auto',
): [string, any] => {
   const arrKey = key.split(':');
   const type = arrKey[1];
   const k = arrKey[0];
   let value: any = source;
   if (type) {
      switch (type) {
         case 'string':
            value = '' + source;
            break;
         case 'boolean':
            value = toBoolean(source);
            break;
         case 'number':
            value = toNumber(source);
            break;
      }
   } else if (mode == 'auto') {
      value = toBoolean(source);
      value = toNumber(value);
   }

   return [k, value];
};

const parseObject = (data: More, mode = 'auto') => {
   let payload: More = {};
   for (const [k, v] of Object.entries<string>(data)) {
      const [key, value] = parseTyped(k, v, mode);
      payload[key] = value;
   }
   return payload;
};

export class CogenvTyped extends Moduly implements onModuly {
   onModuleRun() {
      this.setMeta({
         name: '@cogenv/typed',
         version: '1.0.0',
      });

      this.setPipes({
         // /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
         parseMatch: {
            break: true,
            call: this.onPipeParse(),
         },
      });

      this.setHelpers({
         toBoolean,
         toNumber,
         parseTyped,
         parseObject,
      });
   }
   onPipeParse() {
      return () => {};
   }
   onModuleInit() {
      return () => {
         // console.log(this._pipes);
      };
   }
}
