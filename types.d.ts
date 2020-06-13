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
   path?: string;
   encoding?: string;
   logging?: boolean;
}

interface More {
   [key: string]: any;
}

interface Stat extends CogenvOptions {
   initialized: boolean;
   version: number | string;
   plugins?: More[];
}
