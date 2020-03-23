interface Cogenv {
   // Enter to here your types
   PORT?: number;
   NODE_ENV?: string;
   [key: string]: any;
}

interface Cog extends NodeJS.Process {
   env: Cogenv;
}

declare var cog: Cog;
