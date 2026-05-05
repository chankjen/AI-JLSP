const bcrypt = require('bcryptjs');

async function generate() {
  const hash = await bcrypt.hash('password123', 12);
  console.log(hash);
}

generate();
