const path = require('path');
//const UglifyJSPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: './frontend/frontend.js',
  watch:true,
  output: {
    path: path.resolve(__dirname, 'distri'),
    filename: 'pennymore.bundle.js'
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: [{
        loader: "style-loader" // creates style nodes from JS strings
      }, {
        loader: "css-loader" // translates CSS into CommonJS
      }, {
        loader: "sass-loader" // compiles Sass to CSS
      }]
    }]
  }
};
