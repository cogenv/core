/// <reference path="./globals.d.ts" />

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Merge } from 'merge-all-objects';

interface ParseOptions {
   types?: boolean;
   objects?: boolean;
   interpolatePrefix?: string;
}
export interface CogenvOptions extends ParseOptions {
   path?: string;
   encoding?: string;
   logging?: boolean;
}

interface Stat extends CogenvOptions {
   initialized: boolean;
   version: number | string;
   plugins?: More[];
}

// Variables Data !
const defaultOptions: CogenvOptions = {
   path: '.env',
   encoding: 'utf8',
   interpolatePrefix: '$',
   types: false,
   objects: false,
   logging: true,
};
let database: More = {};
let stat: Stat | More = {
   ...defaultOptions,
   initialized: false,
   version: '1.0.9',
   plugins: [],
};
const rexs = {
   // Parses
   parseline: /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/,
   parselineTyped: /^\s*([\w.-]+)[:]\s*([a-z]+)\s*=\s*(.*)?\s*$/,
   parselineObject: /^\s*(^[\w\-\>\:]+)\s*=\s*(.*)?\s*$/,

   // Lines
   newline: '\n',
   newlines: /\\n/g,
   newlinesMatch: /\n|\r|\r\n/,

   // Parse interpolate
   interpolate: () => {
      return new RegExp(
         `(.?\\${stat.interpolatePrefix}{?(?:[a-zA-Z0-9_\.]+)?}?)`,
         'g',
      );
   },
   interpolateParts: () => {
      return new RegExp(
         `(.?)\\${stat.interpolatePrefix}{?([a-zA-Z0-9_\.]+)?}?`,
      );
   },
};

// Designed the variables a value
global.cog = process;

const Log = (msg: string, plugin?: string) => {
   if (!stat.logging) {
      return;
   }
   let message = `[@cogenv/core]`;
   plugin && (message += `[${plugin}]`);
   message += ` ${msg} - ${new Date().toLocaleString()}`;
   console.log(message);
};

const Parse = (
   source: string,
   { interpolatePrefix, types, objects }: ParseOptions,
) => {
   const payload: More = {};
   const arr = source.toString().split(rexs.newlinesMatch);

   const toValue = (val: string): string => {
      if (!val) {
         return '';
      }
      const end = val.length - 1;
      const isDoubleQuoted = val[0] === '"' && val[end] === '"';
      const isSingleQuoted = val[0] === "'" && val[end] === "'";

      // if single or double quoted, remove quotes
      if (isSingleQuoted || isDoubleQuoted) {
         val = val.substring(1, end);

         // if double quoted, expand newlines
         if (isDoubleQuoted) {
            val = val.replace(rexs.newlines, rexs.newline);
         }
      } else {
         // remove surrounding whitespace
         val = val.trim();
      }
      val = parseInterpolate(val);
      return val;
   };

   const parseInterpolate = (source: string) => {
      if (typeof source !== 'string') {
         return source;
      }

      var matches: any[] = source.match(rexs.interpolate()) || [];

      if (matches.length > 0) {
         return matches.reduce(function (newEnv, match) {
            var parts = match.match(rexs.interpolateParts()) || [];
            var prefix = parts[1];

            var value, replacePart;

            if (prefix === '\\') {
               replacePart = parts[0];
               value = replacePart.replace(
                  `\\${interpolatePrefix}`,
                  interpolatePrefix,
               );
            } else {
               var key = parts[2];
               replacePart = parts[0].substring(prefix.length);

               value = payload[key];
               if (!value && objects) {
                  key = key.replace(/\./g, '->');
                  value = payload._objects[key];
               }

               // process.env value 'wins' over .env file's value

               // Resolve recursive interpolations
               value = parseInterpolate(value);
            }

            return newEnv.replace(replacePart, value);
         }, source);
      } else {
         return source;
      }
   };

   for (const v of arr) {
      if (!v) {
         continue;
      }

      const matchkey = v.match(rexs.parseline);

      // If is a type
      let isTypeKey = v.match(rexs.parselineTyped);

      // If is an object
      let matchObjectKey = v.match(rexs.parselineObject);
      let isObjectKey: any = false;
      if (matchObjectKey) {
         isObjectKey = matchObjectKey[1].split(/\-\>/gi);
         isObjectKey = isObjectKey.length > 1;
      }

      if (matchkey != null) {
         let [z, key, value] = matchkey;
         value = toValue(value);
         payload[key] = value;
      } else if (isTypeKey) {
         let [z, key, type, value] = isTypeKey;
         value = toValue(value);
         payload[key] = value;
         if (types) {
            payload['_types'] = Merge(payload._types || {});
            key = `${key}:${type}`;
            payload['_types'][key] = value;
         }
      } else if (isObjectKey && objects) {
         payload['_objects'] = Merge(payload._objects || {});
         let [z, key, value] = matchObjectKey;
         value = toValue(value);
         payload['_objects'][key] = value;
      }
   }

   return payload;
};

const Config = (options: CogenvOptions = {}) => {
   options = Merge(defaultOptions, options);
   stat = Merge(stat, options);
   Log('Starting...');
   const { path, encoding, types, objects, interpolatePrefix } = options;

   let cogenvPath = resolve(cog.cwd(), path);

   try {
      let parsed: string | More = readFileSync(cogenvPath, {
         encoding: encoding as any,
      });
      parsed = Parse(parsed as any, {
         types,
         objects,
         interpolatePrefix,
      });
      setDatabase(parsed);
      stat.initialized = true;
      Log('Variable envirements file ' + stat.path);
      Log('Initialized Correctly');
      return { parsed };
   } catch (e) {
      console.log('[@cogenv/core][Error]', e);
      return { error: e };
   }
};

const setDatabase = (data: More, more?: More) => {
   database = Merge(database, data, more);
   cog.env = Merge(cog.env, database, more);
};

// Getters
const envStat = () => stat;
const env = (key: string) => database[key] || cog.env[key];

const Use = <T>(fn: Function, options?: T | Function) => {
   let plugin: More;
   const register = (data: Plugin) => {
      stat.plugins.push(data);
      plugin = data;
      Log('Registered...', data.name);
   };
   !options && (options = register);
   const data = fn(database, options, register);
   data && setDatabase(data, plugin?.mergeOptions);
   Log('Started Correctly', plugin?.name);
};

export { Parse, Config, Use, envStat, env };
export default Config;
