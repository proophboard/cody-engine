const { composePlugins, withNx } = require('@nx/webpack');
const { withReact } = require('@nx/react');

// Nx plugins for webpack.
module.exports = composePlugins(withNx(), withReact(), (config) => {
  // Update the webpack config as needed here.
  // e.g. `config.plugins.push(new MyPlugin())`
  config.devServer = {
    ...config.devServer,
    port: 4300,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization, Ce-User"
    }
  };

  config.externals = {
    fs: 'fs'
  }

  config.plugins = config.plugins || [];

  config.ignoreWarnings = [
    /the request of a dependency is an expression/
  ];

  return config;
});
