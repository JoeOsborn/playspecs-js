const path = require('path');

module.exports = {
    entry: './src/playspecs.ts',
    devtool: 'source-map',
    mode: 'production',
    module: {
        rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/
        }
      ]
    },
    resolve: {
      extensions: [ '.tsx', '.ts', '.js' ]
    },
    output: {
      filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'var',
        library: 'Playspecs'
    }
};

// module.exports = {
//     context: __dirname + "/src",
//     entry: "./playspecs.js",
//     output: {
//         path: __dirname,
//         filename: "playspecs.js",
//         // export itself to a global var
//         libraryTarget: "var",
//         // name of the global var: "Foo"
//         library: "Playspecs"
//     },
//     module: {
//         loaders: [
//             {
//                 test: /\.jsx?$/,
//                 exclude: /(node_modules|bower_components)/,
//                 loader: 'babel'
//             }
//         ]
//     },
//     devtool: "#source-map"
// }
