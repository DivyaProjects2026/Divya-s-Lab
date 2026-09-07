// Usage: node scripts/hash-password.js "yourChosenPassword"
// Copy the printed hash into your .env file as ADMIN_PASSWORD_HASH
const bcrypt = require("bcryptjs");

const pw = process.argv[2];
if (!pw) {
  console.log('Usage: node scripts/hash-password.js "yourChosenPassword"');
  process.exit(1);
}

bcrypt.hash(pw, 10).then((hash) => {
  console.log("\nAdd this line to your .env file:\n");
  console.log("ADMIN_PASSWORD_HASH=" + hash + "\n");
});
