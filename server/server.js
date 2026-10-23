require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`[server] Farmer Marketplace API listening on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('[fatal] Unhandled rejection:', err);
  process.exit(1);
});

start();
