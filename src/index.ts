import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Merge } from 'merge-options-default';

// Interfaces
declare var global: {
   cog: NodeJS.Process;
};
interface ParseOptions {
   types?: boolean;
   objects?: boolean;
   interpolatePrefix?: string;
}
interface CogenvOptions extends ParseOptions {
   path?: '.env';
   encoding?: 'utf8';
   logging?: boolean;
}

interface More {
   [key: string]: any;
}

interface Plugin {
   name: string;
   version: string;
}

interface Stat extends CogenvOptions {
   initialized: boolean;
   version: number | string;
   plugins?: Plugin[];
}

// Variables Data !
const NEWLINE = '\n';
let PARSE_MATCH_LINE = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/;

const RE_NEWLINES = /\\n/g;
const NEWLINES_MATCH = /\n|\r|\r\n/;
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
   const arr = source.toString().split(NEWLINES_MATCH);

   const RegexInterpolate = new RegExp(
      `(.?\\${interpolatePrefix}{?(?:[a-zA-Z0-9_]+)?}?)`,
      'g',
   );
   const RegexInterpolateParts = new RegExp(
      `(.?)\\${interpolatePrefix}{?([a-zA-Z0-9_]+)?}?`,
      'g',
   );

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
            val = val.replace(RE_NEWLINES, NEWLINE);
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

      var matches: any[] = source.match(RegexInterpolate) || [];

      if (matches.length > 0) {
         return matches.reduce(function(newEnv, match) {
            var parts = RegexInterpolateParts.exec(match);
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

      const matchkey = v.match(PARSE_MATCH_LINE);

      // If is a type
      let isTypeKey: any = /^\s*([\w.-]+)[:]\s*([a-z]+)\s*=\s*(.*)?\s*$/;
      isTypeKey = v.match(isTypeKey);

      // If is an object
      let matchObjectKey = v.match(/^\s*(^[\w\-\>\:]+)\s*=\s*(.*)?\s*$/);
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
      let parsed: string | More = readFileSync(cogenvPath, { encoding });
      parsed = Parse(parsed, {
         types,
         objects,
         interpolatePrefix,
      });
      SetDatabase(parsed);
      stat.initialized = true;
      Log('Initialized Correctly');
      return { parsed };
   } catch (e) {
      return { error: e };
   }
};

const SetDatabase = (data: More) => {
   database = Merge(database, data);
   cog.env = Merge(cog.env, database);
};

// Getters
const GetStat = () => stat;
const GetEnvOne = (key: string) => database[key];

const Use = <T>(fn: Function, options?: T | Function) => {
   let plugin: Plugin;
   const register = (data: Plugin) => {
      stat.plugins.push(data);
      plugin = data;
      Log('Registered...', data.name);
   };
   !options && (options = register);
   const data = fn(database, options, register);
   data && SetDatabase(data);
   Log('Started Correctly', plugin.name);
};

const Cogenv = {
   Parse,
   Config,
   Use,
   GetStat,
   GetEnvOne,
   Get: GetEnvOne,
};

export { Parse, Config, Use, GetStat, GetEnvOne, GetEnvOne as Get };

exports = Cogenv;
export default Cogenv;
