import bcrypt from "bcrypt";

async function main() {
  const password = "test1234"; // password you will log in with
  const hash = await bcrypt.hash(password, 10);
  console.log("Password:", password);
  console.log("Hash:", hash);
}

main();
