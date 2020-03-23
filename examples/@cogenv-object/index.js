const Cogenv = require('@cogenv/core');
const CogenvObject = require('@cogenv/object').CogenvObject;

Cogenv.Config({
   // Options
   objects: true,
});

Cogenv.Use(CogenvObject);

console.log(cog.env);
