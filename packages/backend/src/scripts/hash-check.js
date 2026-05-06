const bcrypt = require('bcryptjs');

const pass = 'admin123';
const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPjYQmHqXaUe';

bcrypt.compare(pass, hash, (err, res) => {
    console.log('Match:', res);
});

bcrypt.hash(pass, 12, (err, h) => {
    console.log('New hash:', h);
});
