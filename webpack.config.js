var webpack = require('webpack');

module.exports = {
  entry: './index',
  output: {
    path: __dirname,
    filename: 'out.js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      { test: /\.jsx?$/, loaders: ['jsx?harmony'], exclude: /node_modules/ },
    ]
  }
};
