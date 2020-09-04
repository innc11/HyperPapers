const merge = require('webpack-merge')
const common = require('./webpack.common.js')

console.log(merge)

module.exports = merge.merge(common, {
    mode: 'development',
    devtool: 'cheap-source-map',
    devServer: {
        port: 9000
    }
})