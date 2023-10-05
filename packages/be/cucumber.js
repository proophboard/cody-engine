// cucumber.js
let common = [
  'features/**/*.feature',                // Specify our feature files
  '--require-module ts-node/register', //typescript cucumber
  '--require-module tsconfig-paths/register', //typescript cucumber
  '--require ./features/step_definitions/**/*.ts',   // Load step definitions
].join(' ');

process.env['NODE_ENV'] = "test";

module.exports = {
  default: common
};
