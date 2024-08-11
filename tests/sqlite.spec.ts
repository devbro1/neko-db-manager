import { describe, expect, test } from "@jest/globals";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Query } from "../src/index";
import { listeners } from "process";
import { Connection } from "pg";
import { SqliteConnection } from "../src/Schema/Connections/SqliteConnection";

describe("sqlite database", () => {
  let query: any;
  beforeEach(async () => {

    const db = await open({
        filename: '/tmp/database.db',
        driver: sqlite3.Database
      });
    
    await db.exec(`DROP TABLE IF EXISTS persons`);
    await db.exec(`CREATE TABLE IF NOT EXISTS persons (
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
  
  test("sqlite basic select", () => {
    let result;
    const conn = new SqliteConnection("/tmp/database.db",'', { client: "sqlite", connection: "/tmp/database.db"});
    result = conn.query().from("persons").select('*').get();
    expect(result.length).toBe(10);

    result = conn.query().from("persons").select('*').where('age','>',85).get();
    expect(result.length).toBe(3);
  });
});
