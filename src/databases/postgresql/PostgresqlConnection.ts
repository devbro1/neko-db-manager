import { Connection as ConnectionAbs } from '../../Connection';
import { Connection, PoolClient, PoolConfig } from 'pg';
import { Pool } from 'pg';
import { CompiledSql } from '../../types';
export class PostgresqlConnection extends ConnectionAbs {
    connection: PoolClient | undefined;
    static pool: Pool;

    constructor(params: PoolConfig) {
        super();
        if(!PostgresqlConnection.pool) {
            const defaults: PoolConfig = {
                port: 5432,
                ssl: false,
                max: 20,
                idleTimeoutMillis: 1000,
                connectionTimeoutMillis: 1000,
                maxUses: 7500,
              };
        PostgresqlConnection.pool = new Pool({...defaults, ...params});
        }
    }
    async connect(): Promise<boolean> {
        this.connection = await PostgresqlConnection.pool.connect();
        return true;
    }
    async runQuery(sql: CompiledSql) {
        let counter=0;
        let result = await this.connection?.query(sql.sql.replace(/\?/g, () => `$${++counter}`),sql.bindings);

        return result?.rows;
    }
    disconnect(): boolean {
        this.connection?.release();
        return true;
    }
}