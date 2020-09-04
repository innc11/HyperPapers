const path = require('path');
const htmlwebpack = require('html-webpack-plugin')
const {CleanWebpackPlugin} = require('clean-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

module.exports = {
    entry: ['./js/index.ts', './js/plugins/auth.vue', './js/plugins/attach.vue'],
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'allinone.js'
    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif|ttf|eot|woff|woff2)$/i,
                use: [
                    { loader: 'url-loader', options: { limit: 8192 } }
                ]
            },
            { test: /\.css$/,  use: ['style-loader', 'css-loader'] },
            { test: /\.tsx?$/, loader: 'ts-loader',  options: { appendTsSuffixTo: [/\.vue$/] } },
            { test: /\.vue$/, use: ['vue-loader'] },
            
        ]
    },
    plugins: [
        new VueLoaderPlugin(),
        new CleanWebpackPlugin(),
        new htmlwebpack({template: './index.html' }),
    ],
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js',
        },
        extensions: [".js", ".ts", ".vue"]
    },
    externals: {
        jquery: 'window.$',
    },
    performance: {
        maxEntrypointSize: 10000000,
        maxAssetSize: 10000000
    }
}