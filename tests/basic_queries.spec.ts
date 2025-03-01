import { describe, expect, test } from "@jest/globals";
import { Query } from "../src/Query";
import { QueryGrammar } from "../src/QueryGrammar";
import { PostgresqlConnection } from "../src/databases/postgresql/PostgresqlConnection";
import { Connection } from "../src/Connection";
import { execSync } from "child_process";
describe("raw queries", () => {
  let conn: Connection | null;

  beforeAll(async () => {
    const randName = Math.random().toString(36).substring(7);
    const db_config = {
      host: process.env.DB_HOST,
      database: (process.env.DB_NAME || 'test_db') + `_${randName}`,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      port: parseInt(process.env.DB_PORT || '5432'),
    };

    console.log("creating test database", db_config.database);
    execSync(`psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} postgres -c "CREATE DATABASE ${db_config.database}"`);
    console.log("load database schema and data");
    execSync(`psql --host ${db_config.host} --user ${db_config.user} --port ${db_config.port} -f ./tests/fixtures/load_hr_db_pg.sql ${db_config.database}`);

    conn = new PostgresqlConnection(db_config);
    await conn.connect();
  });

  afterAll(async () => {
    await conn?.disconnect();
  })

  test("basic select all", () => {
    const query = new Query( null, new QueryGrammar());
    query.table('countries');
    let r = query.toSql();

    expect(r.sql).toBe("select * from countries");
    expect(r.bindings.length).toBe(0);

    query.whereOp('region_id','=',2);

    r = query.toSql();

    expect(r.sql).toBe("select * from countries where region_id = ?");
    expect(r.bindings).toStrictEqual([2]);


    query.whereOp('country_id','=','BE', 'or', true);

    r = query.toSql();

    expect(r.sql).toBe("select * from countries where region_id = ? or not country_id = ?");
    expect(r.bindings).toStrictEqual([2,'BE']);
  });

  test("basic connection functionality", async () => {
    const query = new Query( conn, new QueryGrammar());
    query.table('countries');
    const r = query.toSql();

    expect(r.sql).toBe("select * from countries");
    expect(r.bindings.length).toBe(0);

    let result = await query.get();
    expect(result.length).toBe(25);

    query.whereOp('country_id','=','CA');
    query.whereOp('country_id','=','JP', 'or');

    result = await query.get();
    expect(result.length).toBe(2);
    expect(result[0].country_name).toBe('Canada');
  });

  test("basic connection functionality v2", async () => {
    const query = new Query( conn, new QueryGrammar());
    query.table('jobs');
    const r = query.toSql();

    expect(r.sql).toBe("select * from jobs");
    expect(r.bindings.length).toBe(0);

    const result1 = await query.get();
    expect(result1.length).toBe(19);

    query.whereOp('job_title','ilike','P%');

    const result2 = await query.get();
    expect(result2.length).toBe(6);
  });
});
