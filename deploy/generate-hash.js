// Simple script to generate bcrypt hash for Vyntrise2026!
const bcrypt = require('bcryptjs');

const password = 'Vyntrise2026!';
const hash = bcrypt.hashSync(password, 12);

console.log('Password:', password);
console.log('Hash:', hash);
