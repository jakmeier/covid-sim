const path = require('path');
const webpack = require('webpack');
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
    },
    plugins: [
        new WasmPackPlugin({
            crateDirectory: path.resolve(__dirname, ".")
        }),
    ],
    devServer: {
        contentBase: "./src",
        hot: true,
    },
    // Development mode is MUCH slower for WASM! Use it only for debugging.
    // mode: 'development',
    module: {
        rules: [{
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
        }, ]
    },
    experiments: {
        syncWebAssembly: true,
        topLevelAwait: true,
    },
};