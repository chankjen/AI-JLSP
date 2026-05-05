const bcrypt = require('bcryptjs');

async function check() {
  const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmHqXaUe';
  const match = await bcrypt.compare('password123', hash);
  console.log('Match:', match);
}

check();
