"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.envStat = exports.Use = exports.Config = exports.Parse = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const merge_all_objects_1 = require("merge-all-objects");
const defaultOptions = {
    path: '.env',
    encoding: 'utf8',
    interpolatePrefix: '$',
    types: false,
    objects: false,
    logging: true,
};
let database = {};
let stat = Object.assign(Object.assign({}, defaultOptions), { initialized: false, version: '1.0.9', plugins: [] });
const rexs = {
    parseline: /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/,
    parselineTyped: /^\s*([\w.-]+)[:]\s*([a-z]+)\s*=\s*(.*)?\s*$/,
    parselineObject: /^\s*(^[\w\-\>\:]+)\s*=\s*(.*)?\s*$/,
    newline: '\n',
    newlines: /\\n/g,
    newlinesMatch: /\n|\r|\r\n/,
    interpolate: () => {
        return new RegExp(`(.?\\${stat.interpolatePrefix}{?(?:[a-zA-Z0-9_\.]+)?}?)`, 'g');
    },
    interpolateParts: () => {
        return new RegExp(`(.?)\\${stat.interpolatePrefix}{?([a-zA-Z0-9_\.]+)?}?`);
    },
};
global.cog = process;
const Log = (msg, plugin) => {
    if (!stat.logging) {
        return;
    }
    let message = `[@cogenv/core]`;
    plugin && (message += `[${plugin}]`);
    message += ` ${msg} - ${new Date().toLocaleString()}`;
    console.log(message);
};
const Parse = (source, { interpolatePrefix, types, objects }) => {
    const payload = {};
    const arr = source.toString().split(rexs.newlinesMatch);
    const toValue = (val) => {
        if (!val) {
            return '';
        }
        const end = val.length - 1;
        const isDoubleQuoted = val[0] === '"' && val[end] === '"';
        const isSingleQuoted = val[0] === "'" && val[end] === "'";
        if (isSingleQuoted || isDoubleQuoted) {
            val = val.substring(1, end);
            if (isDoubleQuoted) {
                val = val.replace(rexs.newlines, rexs.newline);
            }
        }
        else {
            val = val.trim();
        }
        val = parseInterpolate(val);
        return val;
    };
    const parseInterpolate = (source) => {
        if (typeof source !== 'string') {
            return source;
        }
        var matches = source.match(rexs.interpolate()) || [];
        if (matches.length > 0) {
            return matches.reduce(function (newEnv, match) {
                var parts = match.match(rexs.interpolateParts()) || [];
                var prefix = parts[1];
                var value, replacePart;
                if (prefix === '\\') {
                    replacePart = parts[0];
                    value = replacePart.replace(`\\${interpolatePrefix}`, interpolatePrefix);
                }
                else {
                    var key = parts[2];
                    replacePart = parts[0].substring(prefix.length);
                    value = payload[key];
                    if (!value && objects) {
                        key = key.replace(/\./g, '->');
                        value = payload._objects[key];
                    }
                    value = parseInterpolate(value);
                }
                return newEnv.replace(replacePart, value);
            }, source);
        }
        else {
            return source;
        }
    };
    for (const v of arr) {
        if (!v) {
            continue;
        }
        const matchkey = v.match(rexs.parseline);
        let isTypeKey = v.match(rexs.parselineTyped);
        let matchObjectKey = v.match(rexs.parselineObject);
        let isObjectKey = false;
        if (matchObjectKey) {
            isObjectKey = matchObjectKey[1].split(/\-\>/gi);
            isObjectKey = isObjectKey.length > 1;
        }
        if (matchkey != null) {
            let [z, key, value] = matchkey;
            value = toValue(value);
            payload[key] = value;
        }
        else if (isTypeKey) {
            let [z, key, type, value] = isTypeKey;
            value = toValue(value);
            payload[key] = value;
            if (types) {
                payload['_types'] = merge_all_objects_1.Merge(payload._types || {});
                key = `${key}:${type}`;
                payload['_types'][key] = value;
            }
        }
        else if (isObjectKey && objects) {
            payload['_objects'] = merge_all_objects_1.Merge(payload._objects || {});
            let [z, key, value] = matchObjectKey;
            value = toValue(value);
            payload['_objects'][key] = value;
        }
    }
    return payload;
};
exports.Parse = Parse;
const Config = (options = {}) => {
    options = merge_all_objects_1.Merge(defaultOptions, options);
    stat = merge_all_objects_1.Merge(stat, options);
    Log('Starting...');
    const { path, encoding, types, objects, interpolatePrefix } = options;
    let cogenvPath = path_1.resolve(cog.cwd(), path);
    try {
        let parsed = fs_1.readFileSync(cogenvPath, {
            encoding: encoding,
        });
        parsed = Parse(parsed, {
            types,
            objects,
            interpolatePrefix,
        });
        setDatabase(parsed);
        stat.initialized = true;
        Log('Variable envirements file ' + stat.path);
        Log('Initialized Correctly');
        return { parsed };
    }
    catch (e) {
        console.log('[@cogenv/core][Error]', e);
        return { error: e };
    }
};
exports.Config = Config;
const setDatabase = (data, more) => {
    database = merge_all_objects_1.Merge(database, data, more);
    cog.env = merge_all_objects_1.Merge(cog.env, database, more);
};
const envStat = () => stat;
exports.envStat = envStat;
const env = (key) => database[key] || cog.env[key];
exports.env = env;
const Use = (fn, options) => {
    let plugin;
    const register = (data) => {
        stat.plugins.push(data);
        plugin = data;
        Log('Registered...', data.name);
    };
    !options && (options = register);
    const data = fn(database, options, register);
    data && setDatabase(data, plugin === null || plugin === void 0 ? void 0 : plugin.mergeOptions);
    Log('Started Correctly', plugin === null || plugin === void 0 ? void 0 : plugin.name);
};
exports.Use = Use;
exports.default = Config;
