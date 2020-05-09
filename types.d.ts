interface More {
   [key: string]: any;
}

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

interface PluginItem {
   name: string;
   version: string;
}

interface Stat extends CogenvOptions {
   initialized: boolean;
   version: number | string;
   plugins?: PluginItem[];
}
