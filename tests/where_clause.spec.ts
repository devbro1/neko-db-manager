import { describe, expect, test } from "@jest/globals";
import { SqliteConnection } from "../src/Schema/Connections/SqliteConnection";
import * as fs from 'fs';
import tmp from 'tmp';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

describe("where clause", () => {
  let db_name = '';
  beforeEach(async () => {
    db_name = tmp.fileSync({ prefix: 'sqlite-test-', postfix: '.db' }).name;

    // console.log("test sqlitefilename", db_name);
    const db = await open({
        filename: db_name,
        driver: sqlite3.Database
      });
    
    await db.exec(`DROP TABLE IF EXISTS persons`);
    await db.exec(`CREATE TABLE IF not EXISTS persons (
        id INTEGER PRIMARY KEY,
        name TEXT,
        age INTEGER
    )`);

    await db.exec(`CREATE TABLE IF not EXISTS persons2 (
      id INTEGER PRIMARY KEY,
      name TEXT,
      age INTEGER
  )`);

    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person1', 11)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person2', 22)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person3', 33)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person4', 44)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person5', 55)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person6', 66)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person7', 77)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person8', 88)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person9', 99)`);
    await db.exec(`INSERT INTO persons (name, age) VALUES ('Person10', 100)`);

    await db.close();
  });

  afterEach(() => {
    fs.unlinkSync(db_name);
  });

  test("where 1", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query().select("*").from("table").where("col1", "=", "value");

    expect(qb.toSql()).toBe('select * from "table" where "col1" = ?');
    expect(qb.getBindings()).toStrictEqual(['value']);
  });

  test("where 2", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query().select("*").from("table").whereIn("col1", [1, 2, 3, 4]);
    expect(qb.toSql()).toBe("select * from \"table\" where \"col1\" in (?, ?, ?, ?)");
    expect(qb.getBindings()).toStrictEqual([1,2,3,4]);
  });

  test("where 3", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query().select("*").from("table").whereBetween("col1", [111, 222]);

    expect(qb.toSql()).toBe("select * from \"table\" where \"col1\" between ? and ?");
    expect(qb.getBindings()).toStrictEqual([111,222]);
  });

  test("where 4", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query()
      .select("*")
      .from("table")
      .where([
        ["status", "=", "1"],
        ["subscribed", "<>", "1"],
      ]);

    expect(qb.toSql()).toBe("select * from \"table\" where (\"status\" = ? and \"subscribed\" <> ?)");
    expect(qb.getBindings()).toStrictEqual(['1','1']);
  });
  test("where 5", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query()
      .select("*")
      .from("table")
      .where("col1", "=", "value")
      .where("col2", "=", "value2");

    expect(qb.toSql()).toBe("select * from \"table\" where \"col1\" = ? and \"col2\" = ?");
    expect(qb.getBindings()).toStrictEqual(['value','value2']);
  });

  test("orWhere", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query()
      .select("*")
      .from("table")
      .where("col1", "=", "value")
      .orWhere("col2", "=", "value2");

    expect(qb.toSql()).toBe("select * from \"table\" where \"col1\" = ? or \"col2\" = ?");
    expect(qb.getBindings()).toStrictEqual(['value','value2']);
  });

  test("where not", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query().select("*").from("table").orWhereColumn("col1", "!=", "col2");

    expect(qb.toSql()).toBe("select * from \"table\" where \"col1\" != \"col2\"");
  });

  test("where not2", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query().select("*").from("table")
      .where("col3","=","val1")
      .orWhereColumn("col1", "=", "col2");

    expect(qb.toSql()).toBe("select * from \"table\" where \"col3\" = ? or \"col1\" = \"col2\"");
    expect(qb.getBindings()).toStrictEqual(['val1']);
  });

  test("whereNull", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query().select("*").from("table")
    .whereNull("col1");

    expect(qb.toSql()).toBe(
      "select * from \"table\" where \"col1\" is null"
    );
  });

  test("whereDate", () => {
    const conn = new SqliteConnection(db_name);
    const qb = conn.query().select("*").from("table")
    .whereDate("created_at", ">", "2024-09-13 EST");

    expect(qb.toSql()).toBe(
      "select * from \"table\" where strftime('%Y-%m-%d', \"created_at\") > cast(? as text)"
    );
  });
});
