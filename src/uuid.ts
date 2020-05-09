/**
 * @author Yoni Calsin <helloyonicb@gmail.com>
 * @param len Enter to here quantity
 */
export const uuid = (len: number) => {
   var charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
   charset += charset.toLowerCase();
   charset += '0123456789';
   let payload = '';
   while (len) {
      --len;
      var key = Math.floor(Math.random() * charset.length);
      payload += charset[key];
   }
   return payload;
};
