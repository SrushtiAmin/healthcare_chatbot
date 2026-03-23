"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const client_1 = require("@prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const prismaClientSingleton = () => {
    const connectionString = `${process.env.DATABASE_URL}`;
    const host = connectionString.split('@')[1]?.split(':')[0] || '127.0.0.1';
    const pool = new pg_1.Pool({ connectionString });
    const adapter = new adapter_pg_1.PrismaPg(pool);
    // Real-time connection check
    pool.connect((err, client, release) => {
        if (err) {
            console.error(`❌ [Database] Connection FAILED to host: ${host}`);
            console.error(`   Reason: ${err.message}`);
        }
        else {
            console.log(`✅ [Database] Successfully CONNECTED to host: ${host}`);
            release();
        }
    });
    return new client_1.PrismaClient({ adapter });
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
exports.default = prisma;
if (process.env.NODE_ENV !== 'production')
    globalThis.prisma = prisma;
//# sourceMappingURL=prisma.js.map