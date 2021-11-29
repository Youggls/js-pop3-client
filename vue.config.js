module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true
    }
  },
  configureWebpack: {
    devtool: 'source-map'
  }
}