module.exports = {
    context: __dirname + "/src",
    entry: "./playspecs.js",
    output: {
        path: __dirname,
        filename: "playspecs.js",
        // export itself to a global var
        libraryTarget: "var",
        // name of the global var: "Foo"
        library: "Playspecs"
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel'
            }
        ]
    },
    devtool: "#source-map"
}