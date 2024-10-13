const { defineConfig } = require('@vue/cli-service')
// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/socket.io': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        ws: true, // Esto habilita el soporte para WebSocket
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
};

