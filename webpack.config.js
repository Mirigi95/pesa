const path = require('path');

module.exports = {
  entry: './index.js',
  mode: 'development', // Specify the entry point of your application
  output: {
    path: path.resolve(__dirname, 'dist'), // Where to emit the bundles
    filename: 'bundle.js' // Name of each bundle
  },
  module: {
    rules: [
      {
        test: /\.js$/, // Regular expression to match JS files
        exclude: /(node_modules)/, // Exclude node_modules
        use: {
          loader: 'babel-loader', // Use babel-loader to transform ES6 to ES5
        },
      },
    ],
  },
  stats: {
    errorDetails: true,
  },
  resolve: {
    fallback: {
      "node-fetch": require.resolve("node-fetch"),
    },
  },
};
