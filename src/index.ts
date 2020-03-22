import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Merge } from 'merge-options-default';

// Interfaces
declare var global: {
   cogenv: NodeJS.Process;
};
interface CogenvOptions {
   path?: '.env';
   encoding?: 'utf8';
   matchLine?: 'all' | 'normal';
   interpolatePrefix?: string;
}
interface More {
   [key: string]: any;
}

// Variables Data !
const NEWLINE = '\n';
let PARSE_MATCH_LINE = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/;

const RE_NEWLINES = /\\n/g;
const NEWLINES_MATCH = /\n|\r|\r\n/;
const defaultOptions: CogenvOptions = {
   path: '.env',
   encoding: 'utf8',
   matchLine: 'normal',
   interpolatePrefix: '$',
};
let database: More = {};
let allPayload: More = {};

// Designed the variables a value
global.cogenv = process;

export const Parse = (
   source: string,
   matchLine: 'all' | 'normal' = 'normal',
   interpolatePrefix?: string,
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

               value = allPayload[key] || payload[key];

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
      const keyValueArr = v.match(PARSE_MATCH_LINE);

      if (keyValueArr != null) {
         let [z, key, value] = keyValueArr;
         value = toValue(value);
         payload[key] = value;
         allPayload[key] = value;
      } else {
         let containType: any = /^\s*([\w.-]+)[:]\s*([a-z]+)\s*=\s*(.*)?\s*$/;
         containType = v.match(containType);
         if (matchLine == 'all') {
            payload['_types'] = { ...payload._types };
         }
         if (containType) {
            let [z, key, type, value] = containType;
            value = toValue(value);
            allPayload[key] = value;
            payload[key] = value;
            if (matchLine == 'all') {
               key = `${key}@${type}`;
               payload['_types'][key] = value;
            }
         }
      }
   }
   return payload;
};

export const Config = (options: CogenvOptions = {}) => {
   options = Merge(defaultOptions, options);

   let cogenvPath = resolve(process.cwd(), options.path);
   let encoding = options.encoding;

   try {
      let parsed: any = readFileSync(cogenvPath, { encoding });
      parsed = Parse(parsed, options.matchLine, options.interpolatePrefix);
      database = parsed;
      cogenv.env = Merge(cogenv.env, database);
      return { parsed };
   } catch (e) {
      return { error: e };
   }
};

export const Use = <T>(fn: Function, options?: T) => {
   const data = fn(database, options) || {};
   database = Merge(database, data);
   cogenv.env = Merge(cogenv.env, database);
};

export const Cogenv = {
   Parse,
   Config,
   Use,
};

export default Cogenv;
