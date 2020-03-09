## @cogenv/core

**@cogenv/core** is an environment variable manager, and this package belongs to its main `cogenv` package, but if you want to use only this package, here below you will have the documentation, and if you are looking for something more robust and complete, we recommend using the main `cogenv` package.

## 📦 Installation

```bash
npm i --save @cogenv/core
```

## ▶️ Usage

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

If you want to add types to the data, we recommend using the main `cogenv` package.

### Options

| name      | type              | default  |
| --------- | ----------------- | -------- |
| path      | string            | `.env`   |
| encoding  | string            | `utf8`   |
| matchLine | `normal` \| `all` | `normal` |

### Customize path

To customize the environment variable file it is very easy with `@cogenv/core`, by default it is _`.env`_.

```js
const CogenvConfig = require('@cogenv/core');

CogenvConfig({
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

Ejemplo:

```js
const CogenvConfig = require('@cogenv/core');

CogenvConfig({
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

## ⭐ Support for

`@cogenv/core` is an open source project licensed by [MIT](LICENSE). You can grow thanks to the sponsors and the support of the amazing sponsors. If you want to join them, [contact me here](mailto:helloyonicb@gmail.com).

## 🎩 Stay in touch

-  Author [Yoni Calsin](https://github.com/yoicalsin)
-  Twitter [Yoni Calsin](https://twitter.com/yoicalsin)

## Contributors

Thanks to the wonderful people who collaborate with me !

## 📜 License

`@cogenv/core` under [License MIT.](LICENSE)
