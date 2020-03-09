import * as fs from 'fs';
import * as path from 'path';

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
}

const defaultOptions: CogenvOptions = {
   path: '.env',
   encoding: 'utf8',
   matchLine: 'normal',
};

const parse = (source: string, matchLine: 'all' | 'normal' = 'normal') => {
   const payload = {};
   const arr = source.toString().split(NEWLINES_MATCH);

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
      return val;
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

export const Config = (options: CogenvOptions = {}) => {
   options = {
      ...defaultOptions,
      ...options,
   };

   let cogenvPath = path.resolve(process.cwd(), options.path);
   let encoding = options.encoding;

   try {
      let parsed: any = fs.readFileSync(cogenvPath, { encoding });
      parsed = parse(parsed, options.matchLine);
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

export default Config;
module.exports = Config;
