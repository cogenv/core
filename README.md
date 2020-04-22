# @cogenv/core

**@cogenv/core** is an environment variable manager, and this package belongs to its main `cogenv` package, but if you want to use only this package, here below you will have the documentation, and if you are looking for something more robust and complete, we recommend using the main `cogenv` package.

## 📦 Installation

```bash
npm i --save @cogenv/core
```

## ▶️ Usage

Creó el archivo `.cogenv` o `.env` !
Esto se puede personalizar mediante la opción de `path` que requiere la función _Config()_

```bash
# Application Data !
APP_NAME = Application
APP_PORT = 3000
APP_URL = http://website.com
```

```js
import { Config } from '@cogenv/core';

// Called function !
Config({
   /* Here are the options that require this function */
});

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

If you want to add types to the data, we recommend using the main `cogenv` package.

## Options

| name              | type    | default |
| ----------------- | ------- | ------- |
| path              | string  | `.env`  |
| encoding          | string  | `utf8`  |
| types             | boolean | `false` |
| objects           | boolean | `false` |
| interpolatePrefix | string  | `$`     |
| logging           | boolean | `true`  |

### Customize path

To customize the environment variable file it is very easy with `@cogenv/core`, by default it is _`.env`_.

```js
Config({
   path: '.cogenv',
});
```

### Interpolate or expand

To expand the variables between them, it is as follows !

To interpolate it is used the following **`${`variable_name`}`**

```bash
# Application Data !
APP_NAME = Application
APP_PORT = 3000
APP_URL = http://website.com:${APP_PORT}
# Return: http://website.com:3000
```

To interpolate we have some options !

| name              | type     | default |
| ----------------- | -------- | ------- |
| interpolatePrefix | `string` | `$`     |

Example:

```js
Config({
   interpolatePrefix: '%', // %{variable_name}
});
```

In the environment variables file it would look like this !

```bash
# Application Data !
APP_NAME = Application
APP_PORT = 3000
APP_URL = http://website.com:%{APP_PORT}
# Return: http://website.com:3000
```

## Utilidades

-  `GetEnvOne` o `env`: Sirve para obtener un variable de entorno !
-  `GetStat`: Retorna las options, variables, y plugins agregados !

### GetEnvOne or Get

```js
import { GetEnvOne, env } from '@cogenv/core';
//  GetEnvOne or env

const appName = GetEnvOne('APP_NAME');

const appName2 = env('APP_NAME');
// Return to: "Application"
```

### GetStat

```ts
const stat = Cogenv.GetStat();

/*
{
   path: '.env',
   initialized: false,
   encoding: 'utf8',
   interpolatePrefix: '$',
   types: false,
   objects: false,
   logging: false,
   version: '1.0.9',
   plugins: [ ]
}
*/
```

## Typescript

Para utilizar con typescript, tendremos que agregar el tipado global

> Primero crearemos `globals.d.ts` para agregar la variable `cog` como global !

Despues de haber creado el archivo, copié el siguente codigo !

```ts
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
```

## Plugin

Para poder utilizar o agregar un plugin es muy sencillo, unicamente tendremos que utilizar la funcion `Use` que debe importar !

```ts
const Cogenv = require('@cogenv/core');
const pluginFunction = require('plugin-package-name');

Cogenv.Use(pluginFunction);
```

## ⭐ Support for

`@cogenv/core` is an open source project licensed by [MIT](LICENSE). You can grow thanks to the sponsors and the support of the amazing sponsors. If you want to join them, [contact me here](mailto:helloyonicb@gmail.com).

## 🎩 Stay in touch

-  Author [Yoni Calsin](https://github.com/yoicalsin)
-  Twitter [Yoni Calsin](https://twitter.com/yoicalsin)

## Contributors

Thanks to the wonderful people who collaborate with me !

## 📜 License

`@cogenv/core` under [License MIT.](LICENSE)
