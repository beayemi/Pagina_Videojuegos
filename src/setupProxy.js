const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://api.rawg.io',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api',
      },
      onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('origin', 'https://api.rawg.io');
      },
    })
  );
};
