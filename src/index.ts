import { readFileSync } from 'fs';
import { resolve } from 'path';

const NEWLINE = '\n';
let PARSE_MATCH_LINE = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/;

const RE_NEWLINES = /\\n/g;
const NEWLINES_MATCH = /\n|\r|\r\n/;

declare var global: {
   cogenv: NodeJS.Process;
};

global.cogenv = process;

interface CogenvOptions {
   path?: '.env';
   encoding?: 'utf8';
   matchLine?: 'all' | 'normal';
   interpolatePrefix?: string;
}

const defaultOptions: CogenvOptions = {
   path: '.env',
   encoding: 'utf8',
   matchLine: 'normal',
   interpolatePrefix: '$',
};

const CogenvParse = (
   source: string,
   matchLine: 'all' | 'normal' = 'normal',
   interpolatePrefix?: string,
) => {
   const payload = {};
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

   for (const [k, v] of arr.entries()) {
      const keyValueArr = v.match(PARSE_MATCH_LINE);

      let containType: any = /^\s*([\w.-]+)[:|@]\s*([a-z]+)\s*=\s*(.*)?\s*$/;
      containType = v.match(containType);

      if (keyValueArr != null) {
         const key = keyValueArr[1];
         let val = keyValueArr[2] || '';
         1;

         val = toValue(val);

         payload[key] = val;
      } else {
         if (containType && matchLine == 'all') {
            let key = containType[1];
            const type = containType[2];
            let value = containType[3];
            value = toValue(value);
            key = key + '@' + type;
            payload[key] = value;
         }
      }
   }

   return payload;
};

const Config = (options: CogenvOptions = {}) => {
   options = {
      ...defaultOptions,
      ...options,
   };

   let cogenvPath = resolve(process.cwd(), options.path);
   let encoding = options.encoding;

   try {
      let parsed: any = readFileSync(cogenvPath, { encoding });
      parsed = CogenvParse(
         parsed,
         options.matchLine,
         options.interpolatePrefix,
      );
      if (options.matchLine == 'normal') {
         Object.keys(parsed).forEach(k => {
            cogenv.env[k] = parsed[k];
         });
      }
      return { parsed };
   } catch (e) {
      return { error: e };
   }
};

module.exports.Config = Config;
module.exports.CogenvParse = CogenvParse;
module.exports = Config;
