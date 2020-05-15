/// <reference path="../types.d.ts" />
/// <reference path="../globals.d.ts" />

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Merge } from 'merge-all-objects';
import { isFunction, isString, isObject } from 'is-all-utils';
import hash from 'object-hash';
import { CogenvObject } from './object';
import { CogenvTyped } from './typed';

export class Cogenv {
   private _setting: CogenvOptions = {
      path: '.env',
      logging: true,
      encoding: 'utf8',
   };
   private _stat = {
      initialized: false,
   };
   private _pipes = {
      parse: {},
      parseMatch: {},
      env: {},
   };
   private _helpers: More = {};
   private _modules: More = {};
   private _database: More = {};
   constructor() {
      this._helpers = {
         interpolate: {
            module: '@root',
            target: this.interpolate(),
         },
         toValue: {
            module: '@root',
            target: this.toValue(),
         },
      };
   }

   public config(options?: CogenvOptions) {
      this._setting = Merge(this._setting, options);
   }
   public init(fn?: Function) {
      const { path, encoding } = this._setting;

      let cogenvPath = resolve(path);

      try {
         const parsed = readFileSync(cogenvPath, { encoding });

         this.parse(parsed);

         isFunction(fn) && fn(this._setting);
         this._stat.initialized = true;
      } catch {}

      for (const obj of Object.values(this._modules)) {
         const { onModuleInit, _sets } = obj;
         _sets.database(this._database);
         onModuleInit();
      }
   }
   private parse(source: string) {
      const lines = source.toString().split(/\n|\r|\r\n/);

      for (const [key, line] of Object.entries(lines)) {
         // For parse pipes
         for (const pipe of Object.values<any>(this._pipes.parse)) {
            pipe.call(Number(key), line);
         }

         if (!line) continue;

         const matchKey = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);

         if (matchKey) {
            const key = matchKey[1];
            const value = matchKey[2];
            this._database[key] = this.toValue()(value);
         }
      }
   }
   private toValue() {
      return (value: string) => {
         if (!value) return '';
         const end = value.length - 1;
         const isQuoted = value.match(/^(["'])(.*)(["'])$/g);

         // Trimed
         value = value.trim();

         if (isQuoted) {
            value = value.substring(1, end);
         }

         return this.interpolate()(value);
      };
   }
   private interpolate() {
      return (source: string) => {
         if (!isString(source)) return source;
         const matches = source.match(/(.?{\s*([a-zA-Z0-9_.]+)\s*\})/g);

         if (matches) {
            for (const match of matches) {
               const parts = match.match(/(.?){?([a-zA-Z0-9_\.]+)?}?/);
               const [word, prefix, go] = parts;
               let value;

               if (prefix === '\\') {
                  value = word.replace(/^\\{/, '{');
               } else {
                  value = this._database[go];
                  value = this.interpolate()(value);
               }

               if (value) {
                  source = source.replace(`{${go}}`, value);
               }
            }
         }
         return source;
      };
   }
   public env(key: any) {
      //
   }
   public use(target: any, options?: More) {
      const obj = new target(
         options,
         this._database,
         this._setting,
         this._stat,
         this._modules,
         this._pipes,
         this._helpers,
      );

      isFunction(obj.onModuleRun) && obj.onModuleRun();

      const { _newHelpers, _newPipes, meta, onModuleInit, _sets } = obj;

      delete obj._newHelpers;
      delete obj._newPipes;
      delete obj._sets;

      const _hash = hash(meta);

      this._modules[_hash] = {
         id: _hash,
         _sets,
         ...meta,
         onModuleInit,
      };

      if (isObject(_newPipes)) {
         for (const [key, value] of Object.entries(_newPipes)) {
            this._pipes[key][_hash] = value;
         }
      }
      if (isObject(_newHelpers)) {
         for (const [key, value] of Object.entries(_newHelpers)) {
            this._helpers[key] = {
               module: _hash,
               target: value,
            };
         }
      }
   }
}

const app = new Cogenv();

app.config({
   logging: false,
});

app.use(CogenvTyped, {
   mode: 'auto',
});

app.use(CogenvObject);

app.init(() => {
   console.log('Configuration package is initialized !');
});
