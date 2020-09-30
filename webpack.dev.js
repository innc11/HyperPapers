const merge = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge.merge(common, {
    mode: 'development',
    devtool: 'cheap-source-map',
    devServer: {
        port: 9000,
        host: "192.168.1.96"
    }
})