const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Enable CORS for all routes
app.use(cors({
  origin: 'http://localhost:5173', // Your Vite dev server
  credentials: true,
  methods: ['GET', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type']
}));

// Proxy all requests to n8n
app.use('/', createProxyMiddleware({
  target: 'http://localhost:5678',
  changeOrigin: true,
  onProxyReq: (proxyReq, req) => {
    // Log the request for debugging
    console.log('Proxying request:', {
      method: req.method,
      url: req.url,
      headers: req.headers
    });
  }
}));

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
