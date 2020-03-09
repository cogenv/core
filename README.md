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
const CogenvConfig = require('@cogenv/core');

// Called function !
CogenvConfig();

// Log !
const data = cogenv.env.APP_NAME;
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

| name      | type              | default  |
| --------- | ----------------- | -------- |
| path      | string            | `.env`   |
| encoding  | string            | `utf8`   |
| matchLine | `normal` \| `all` | `normal` |

### Customize path

Para personalizar el archivo de variable de entorno es muy sencillo con `@cogenv/core`, por defecto es _`.env`_

```js
const CogenvConfig = require('@cogenv/core');

CogenvConfig({
   path: '.cogenv',
});
```

### Interpolate or expand

Para expandir las variables entre ellas, es de la siguiente manera !

Para interpolar se utiliza lo siguiente **`${`variable_name`}`**

```bash
# Application Data !
APP_NAME = Application
APP_PORT = 3000
APP_URL = http://website.com:${APP_PORT}
# Return: http://website.com:3000
```

Para interpolar tenemos unas opciones !

| name              | type     | default |
| ----------------- | -------- | ------- |
| interpolatePrefix | `string` | `$`     |

Ejemplo:

```js
const CogenvConfig = require('@cogenv/core');

CogenvConfig({
   interpolatePrefix: '%', // %{variable_name}
});
```

En el archivo de variables de entorno seria asi !

```bash
# Application Data !
APP_NAME = Application
APP_PORT = 3000
APP_URL = http://website.com:%{APP_PORT}
# Return: http://website.com:3000
```

## ⭐ Support for

Sass-colors is an open source project licensed by [MIT](LICENSE). You can grow thanks to the sponsors and the support of the amazing sponsors. If you want to join them, [contact me here](mailto:helloyonicb@gmail.com).

## 🎩 Stay in touch

-  Author [Yoni Calsin](https://github.com/yoicalsin)
-  Twitter [Yoni Calsin](https://twitter.com/yoicalsin)

## License

@cogenv/core under [License MIT](LICENSE)
