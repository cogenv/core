/// <reference path="../types.d.ts" />
/// <reference path="../globals.d.ts" />

declare var global: {
   cog: NodeJS.Process;
};

/*!
 * @cogenv/core v1.0.9 (https://github.com/cogenv/core)
 * Copyright 2019 The @cogenv/core Authors
 * Copyright 2019 Yoni Calsin.
 * Licensed under MIT (https://github.com/cogenv/core/blob/master/LICENSE)
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Merge } from 'merge-all-objects';
import {
   isFunction,
   isString,
   isObject,
   isArray,
   isNumber,
   isNull,
   isUndefined,
   isBoolean,
} from 'is-all-utils';
import { uuid } from './uuid';
import hash from 'object-hash';
import { ObjIterate, _ignoreNil } from './util';

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
         return matches.reduce(function(newEnv, match) {
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
      let parsed: string | More = readFileSync(cogenvPath, { encoding });
      parsed = Parse(parsed, {
         types,
         objects,
         interpolatePrefix,
      });
      SetDatabase(parsed);
      stat.initialized = true;
      Log('Variable envirements file ' + stat.path);
      Log('Initialized Correctly');
      return { parsed };
   } catch (e) {
      console.log('[@cogenv/core][Error]', e);
      return { error: e };
   }
};

const SetDatabase = (data: More) => {
   database = Merge(database, data);
   cog.env = Merge(cog.env, database);
};

// Getters
const cogStat = () => stat;
const env = (key: string) => database[key] || cog.env[key];

const Use = <T>(fn: Function, options?: T | Function) => {
   let plugin: PluginItem | More = {};
   const register = (data: PluginItem) => {
      stat.plugins.push(data);
      plugin = data;
      Log('Registered...', data.name);
   };
   !options && (options = register);
   const data = fn(database, options, register);
   data && SetDatabase(data);
   Log('Started Correctly', plugin.name);
};

class CogenvBase {
   private _newPipes: More = {};
   private _newHelpers: More = {};
   protected meta: More = {};
   constructor(
      protected readonly options: More,
      protected readonly _setting: More,
      protected readonly _stat: More,
      protected _modules: More,
      protected _pipes: More,
      protected _helpers: More,
   ) {
      const { onPipeEnv, onPipeParse }: any = this;
      this._newPipes = ObjIterate({ onPipeEnv, onPipeParse }, _ignoreNil);
   }
   protected setMeta(data: More) {
      this.meta = data;
   }
   protected setHelpers(data: More) {
      this._newHelpers = data;
   }
   private _updateModules(data: More) {
      this._modules = Merge(this._modules, data);
   }
   private _updatePipes(data: More) {
      this._pipes = Merge(this._pipes, data);
   }
   private _updateHelpers(data: More) {
      this._helpers = Merge(this._helpers, data);
   }
}

export class Cogenv {
   private _setting: CogenvOptions = {};
   private _stat = {
      instanced: false,
   };
   private _pipes = {
      parse: {},
      env: {},
   };
   private _helpers: More = {};
   private _modules: More = {};
   private payload: More = {};
   constructor() {
      this._helpers = {
         interpolate: {
            module: '@root',
            target: this.interpolate,
         },
         toValue: {
            module: '@root',
            target: this.toValue,
         },
      };
   }

   public config(options?: CogenvOptions) {
      this._setting = Merge(defaultOptions, options);
   }
   public init(fn?: Function) {
      const { path, encoding } = this._setting;

      let cogenvPath = resolve(path);

      try {
         const parsed = readFileSync(cogenvPath, { encoding });

         this.parse(parsed);

         isFunction(fn) && fn(this._setting);
      } catch {}
   }
   private parse(source: string) {
      const lines = source.toString().split(rexs.newlinesMatch);
      const allLines = {};

      var index = 0;
      for (const [key, line] of Object.entries(lines)) {
         if (!line) continue;

         ++index;

         const matchKey = line.match(rexs.parseline);

         // /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/,
         // /^\s*(^[\w\-\>\:]+)\s*=\s*(.*)?\s*$/
         const objKey = line.match(/^\s*(^[\s->\w.-]+)\s*=\s*(.*)?\s*$/);

         if (objKey) {
            allLines[index] = line;
         }

         if (matchKey) {
            const key = matchKey[1];
            const value = matchKey[2];
            this.payload[key] = this.toValue(value);
         }
      }

      for (const [key, line] of Object.entries<string>(allLines)) {
         const index = Number(key);
         const parent = line.match(/^\s*(^[\w\-\>\:]+)\s*=\s*(.*)?\s*$/);

         if (parent) {
            // let currentIndex = index;
            // const nextChild: string = allLines[++currentIndex];
            // const isChild = nextChild.match(
            //    /^\s*(->[\w->:]+)\s*=\s*(.*)?\s*$/g,
            // );

            // if (isChild) {
            // console.log('Si es');
            // }
            let currentIndex = index;
            let notFoundChild = true;

            while (notFoundChild) {
               const nextChild: string = allLines[++currentIndex];

               !nextChild && (notFoundChild = false);

               const isChild = nextChild.match(
                  /^\s*(->[\w->:]+)\s*=\s*(.*)?\s*$/g,
               );

               !isChild && (notFoundChild = false);

               // console.log(isChild);
            }
            // for (var i = 0; i < Object.keys(allLines).length; i++) {
            //    const nextChild: string = allLines[++currentIndex];

            //    if (!nextChild) i = 0;

            //    const isChild = nextChild.match(
            //       /^\s*(->[\w->:]+)\s*=\s*(.*)?\s*$/g,
            //    );

            //    if (!isChild) i = 0;

            //    console.log(isChild);
            // }
         } else {
            continue;
         }
      }
      // console.log(allLines);
   }
   private toValue(value: string) {
      if (!value) return '';
      const end = value.length - 1;
      const isQuoted = value.match(/^(["'])(.*)(["'])$/g);

      // Trimed
      value = value.trim();

      if (isQuoted) {
         value = value.substring(1, end);
      }

      return this.interpolate(value);
   }
   private interpolate(value: string) {
      if (!isString(value)) return value;

      const matches = value.match(/(.?\${?(?:[a-zA-Z0-9_.]+)?}?)/g);

      return value;
   }
   public use(target: any, options?: More) {
      const obj = new target(
         options,
         this._setting,
         this._stat,
         this._modules,
         this._pipes,
         this._helpers,
      );

      isFunction(obj.onModuleRun) && obj.onModuleRun();

      const { _newHelpers, _newPipes, meta } = obj;

      delete obj._newHelpers;
      delete obj._newPipes;
      const token = hash(meta);

      this._modules[token] = {
         token,
         ...meta,
      };

      if (isObject(_newPipes)) {
         for (const [key, value] of Object.entries(_newPipes)) {
            if (/Env$/.test(key)) {
               this._pipes.env[token] = value;
            } else if (/Parse$/.test(key)) {
               this._pipes.parse[token] = value;
            }
         }
      }
      if (isObject(_newHelpers)) {
         for (const [key, value] of Object.entries(_newHelpers)) {
            this._helpers[key] = {
               module: token,
               target: value,
            };
         }
      }

      // Cogenv instanced correctly !
      this._stat.instanced = true;

      isFunction(obj.onModuleInit) && obj.onModuleInit();
   }
}

const app = new Cogenv();

app.config({
   logging: false,
});

interface onCogenvInit {
   onModuleRun(): void;
   onModuleInit(): void;
   onPipeEnv?(): void;
   onPipeParse?(): void;
   onPipeToValue?(): void;
   onPipeInterpolate?(): void;
}

class CogenvObject extends CogenvBase implements onCogenvInit {
   onModuleRun() {
      this.setMeta({
         name: '@cogenv/object',
         version: '1.0.0',
      });
   }
   onModuleInit() {}
}

app.init();

// console.log(app);
