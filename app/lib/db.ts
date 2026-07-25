import mysql from "mysql2/promise";

console.log("================================");
console.log("Database Environment Variables");
console.log("HOST =", process.env.DB_HOST);
console.log("USER =", process.env.DB_USER);
console.log("PASSWORD =", process.env.DB_PASSWORD);
console.log("DATABASE =", process.env.DB_NAME);
console.log("================================");

const pool = mysql.createPool({
  host: process.env.DB_HOST!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  database: process.env.DB_NAME!,
  waitForConnections: true,
  connectionLimit: 10,
});

export default pool;