import { Pool, PoolClient } from 'pg';
export declare function connectDatabase(): Promise<Pool | null>;
export declare function getPool(): Pool | null;
export declare function getClient(): Promise<PoolClient | null>;
export declare function query<T = unknown>(text: string, params?: unknown[]): Promise<{
    rows: T[];
    rowCount: number | null;
}>;
export declare function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T | null>;
export declare function healthCheck(): Promise<boolean>;
export declare function closeDatabase(): Promise<void>;
declare const _default: {
    connectDatabase: typeof connectDatabase;
    getPool: typeof getPool;
    getClient: typeof getClient;
    query: typeof query;
    transaction: typeof transaction;
    healthCheck: typeof healthCheck;
    closeDatabase: typeof closeDatabase;
};
export default _default;
//# sourceMappingURL=connection.d.ts.map