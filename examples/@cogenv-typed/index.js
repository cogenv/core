const Cogenv = require('@cogenv/core');
const CogenvTyped = require('@cogenv/typed').default;

Cogenv.Config({
   // Options
   types: true,
});

Cogenv.Use(CogenvTyped, {
   // CogenvTyped options
});

console.log(cog.env);
