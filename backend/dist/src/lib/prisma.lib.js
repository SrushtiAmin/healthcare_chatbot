"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({ adapter });
};
const prisma = globalThis.prisma ?? prismaClientSingleton();
exports.default = prisma;
if (process.env.NODE_ENV !== 'production')
    globalThis.prisma = prisma;
//# sourceMappingURL=prisma.lib.js.map