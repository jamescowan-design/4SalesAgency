import { drizzle } from "drizzle-orm/mysql2";

const db = drizzle(process.env.DATABASE_URL!);
const result = await db.execute("SHOW TABLES");
console.log(JSON.stringify(result, null, 2));
