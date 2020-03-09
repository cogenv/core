## @cogenv/core

## Installed

```bash
npm i --save @cogenv/core
```

## Usage

Created `.cogenv` or `.env` file !

```bash
# Application Data !
APP_NAME = Application
APP_PORT = 3000
APP_URL = http://website.com
```

```js
const cogenv = require('@cogenv/core');
cogenv();

const data = cogenv.env;

console.log(data);
/* Return:
{
   APP_NAME: "Application",
   APP_PORT: "3000",
   APP_URL: "http://website.com"
}
*/
```

Si usted quiere agregar tipos a los datos, le redomendamos usar el paquete principal de `cogenv`.

### Options

| name      | type   | default  |
| --------- | ------ | -------- |
| path      | string | `.env`   |
| encoding  | string | `utf8`   |
| matchLine | string | `normal` |

## License

@cogenv/core under [License MIT](LICENSE)
