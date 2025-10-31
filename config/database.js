// MySQL-тэй холбогдох код
// Энэ файл database-тэй холбогдож, query ажиллуулна

const mysql = require('mysql2');
require('dotenv').config(); // .env файлын мэдээллийг уншина

// Connection Pool үүсгэх
// Pool гэдэг нь олон холболт хадгалж, дахин ашиглана (хурдтай)
const pool = mysql.createPool({
  host: process.env.DB_HOST,         // Хаана байгаа? (localhost)
  user: process.env.DB_USER,         // Хэн нэвтэрч байгаа? (root)
  password: process.env.DB_PASSWORD, // Нууц үг
  database: process.env.DB_NAME,     // Ямар database? (elch_news)
  waitForConnections: true,          // Хүлээх үү холболт чөлөөлөгдөхийг
  connectionLimit: 10,               // Хамгийн ихдээ 10 холболт нэгэн зэрэг
  queueLimit: 0                      // Дараалал хязгааргүй
});

// Promise ашиглах (async/await-д зориулж)
const promisePool = pool.promise();

// Database холбогдож байгаа эсэхийг шалгах
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL холболт амжилтгүй:', err.message);
    return;
  }
  console.log('✅ MySQL амжилттай холбогдлоо!');
  connection.release(); // Холболтыг буцааж өгөх
});

// Бусад файлд ашиглахын тулд export хийх
module.exports = promisePool;
