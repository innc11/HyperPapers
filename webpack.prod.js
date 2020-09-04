const merge = require('webpack-merge')
const common = require('./webpack.common.js')
const ParallelUglifyPlugin = require('webpack-parallel-uglify-plugin');

module.exports = merge.merge(common, {
    mode: 'production',
    devtool: 'source-map',
    plugins: [
        new ParallelUglifyPlugin({
            sourceMap: true
        })
    ]
})