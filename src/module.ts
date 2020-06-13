import Merge from 'merge-all-objects';

export interface onModuly {
   onModuleRun(): void;
   onModuleInit(): void;
   onPipeEnv?(): void;
   onPipeParse?(): any;
   onPipeToValue?(): void;
   onPipeInterpolate?(): void;
}

export class Moduly {
   private _newPipes: More = {};
   private _newHelpers: More = {};
   private _sets: More = {};
   protected meta: More = {};
   constructor(
      protected readonly options: More,
      protected _database: More,
      protected readonly _setting: More,
      protected readonly _stat: More,
      protected _modules: More,
      protected _pipes: More,
      protected _helpers: More,
   ) {
      this._sets = {
         database: this.setDatabase(),
      };
      (this as More).onModuleInit = (this as More).onModuleInit();
   }
   protected setMeta(data: More) {
      this.meta = data;
   }
   protected setPipes(data: More) {
      this._newPipes = data;
   }
   protected setHelpers(data: More) {
      this._newHelpers = data;
   }
   private setDatabase() {
      return (data: More) => {
         this._database = Merge(this._database, data);
      };
   }
}
