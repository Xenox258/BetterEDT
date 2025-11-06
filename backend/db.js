import mysql from "mysql2/promise";

export const DB_CONFIG = {
  host: process.env.DB_HOST ?? "10.0.0.2",
  user: process.env.DB_USER ?? "flopedt_user",
  password: process.env.DB_PASSWORD ?? "edtpassword",
  database: process.env.DB_NAME ?? "flopedt_db",
  port: Number(process.env.DB_PORT ?? 3306),
  timezone: "Z",
  charset: "utf8mb4",
  connectionLimit: 10,
};

export const pool = mysql.createPool(DB_CONFIG);

export async function withTx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const res = await fn(conn);
    await conn.commit();
    return res;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}