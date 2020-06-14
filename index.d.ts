/// <reference path="globals.d.ts" />
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
declare const Parse: (source: string, { interpolatePrefix, types, objects }: ParseOptions) => More;
declare const Config: (options?: CogenvOptions) => {
    parsed: More;
    error?: undefined;
} | {
    error: any;
    parsed?: undefined;
};
declare const envStat: () => More | Stat;
declare const env: (key: string) => any;
declare const Use: <T>(fn: Function, options?: Function | T) => void;
export { Parse, Config, Use, envStat, env };
export default Config;
