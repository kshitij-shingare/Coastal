import { RedisClientType } from 'redis';
export declare function connectRedis(): Promise<RedisClientType | null>;
export declare function getRedisClient(): RedisClientType | null;
export declare function isRedisAvailable(): boolean;
export declare function healthCheck(): Promise<boolean>;
export declare function closeRedis(): Promise<void>;
export declare function get<T>(key: string): Promise<T | null>;
export declare function set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean>;
export declare function del(key: string): Promise<boolean>;
export declare function delPattern(pattern: string): Promise<boolean>;
declare const _default: {
    connectRedis: typeof connectRedis;
    getRedisClient: typeof getRedisClient;
    isRedisAvailable: typeof isRedisAvailable;
    healthCheck: typeof healthCheck;
    closeRedis: typeof closeRedis;
    get: typeof get;
    set: typeof set;
    del: typeof del;
    delPattern: typeof delPattern;
};
export default _default;
//# sourceMappingURL=redis.d.ts.map