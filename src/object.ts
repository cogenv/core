import { Moduly, onModuly } from './module';

export class CogenvObject extends Moduly implements onModuly {
   private tempPayload: More = {};
   private payload: More = {};
   onModuleRun() {
      this.setMeta({
         name: '@cogenv/object',
         version: '1.0.0',
      });
      this.setPipes({
         parse: {
            call: this.onPipeParse(),
         },
      });
   }
   onModuleInit() {
      let index = 0;
      return () => {
         for (const [line, value] of Object.entries(this.tempPayload)) {
            const isParent = value.match(/^\s*(^[\w\-\>\:]+)\s*=\s*(.*)?\s*$/);
            ++index;
            if (!isParent) continue;
            let [parent, parentKey, parentValue] = isParent;
            parent = parentKey.split('->')[0];

            let currentIndex = index;
            let notFoundChild = true;
            while (notFoundChild) {
               const nextChild = this.tempPayload[++currentIndex];
               if (!nextChild) {
                  notFoundChild = false;
                  continue;
               }

               const isChild = nextChild.match(
                  /^\s*(->[\w->:]+)\s*=\s*(.*)?\s*$/g,
               );

               if (!isChild) {
                  notFoundChild = false;
                  continue;
               }

               let child: string = isChild[0];
               child = child.split('=')[0];
               child = child.trim();
               child = parent + child;

               this.payload[child] = parentValue;
            }
         }
      };
   }
   onPipeParse() {
      let index = 0;
      return (_key: number, value: string) => {
         // If is an comment line
         const isObjectLine = value.match(/[->]+/);
         const isComment = value.match(/^\#\s*(.*)/);
         if (!value || isComment || !isObjectLine) return;
         ++index;
         this.tempPayload[index] = value;
         return;
      };
   }
}
