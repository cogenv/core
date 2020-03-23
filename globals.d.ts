interface More {
   [key: string]: any;
}
interface Cogenv extends More {
   // Enter to here your types
   PORT?: number;
   NODE_ENV?: string;
   _types?: More;
   _objects?: More;
}

interface Cog extends NodeJS.Process {
   env: Cogenv;
}

declare var cog: Cog;
