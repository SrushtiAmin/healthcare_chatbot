import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const prismaClientSingleton = () => {
    const connectionString = `${process.env.DATABASE_URL}`;
    const host = connectionString.split('@')[1]?.split(':')[0] || '127.0.0.1';

    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool as any);

    // Real-time connection check
    pool.connect((err, client, release) => {
        if (err) {
            console.error(`❌ [Database] Connection FAILED to host: ${host}`);
            console.error(`   Reason: ${err.message}`);
        } else {
            console.log(`✅ [Database] Successfully CONNECTED to host: ${host}`);
            release();
        }
    });

    return new PrismaClient({ adapter });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
