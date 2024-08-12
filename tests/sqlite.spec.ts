import { describe, expect, test } from "@jest/globals";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { Query } from "../src/index";
import { listeners } from "process";
import { Connection } from "pg";
import { SqliteConnection } from "../src/Schema/Connections/SqliteConnection";
import tmp from 'tmp';
import Database from 'better-sqlite3';
import os from 'os';
import * as fs from 'fs';


let db_name = '';
describe("sqlite database", () => {
  let query: any;
  beforeEach(async () => {
    db_name = tmp.fileSync({ prefix: 'sqlite-test-', postfix: '.db' }).name;

    console.log("test sqlitefilename", db_name);
    const db = await open({
        filename: db_name,
        driver: sqlite3.Database
      });
    
    await db.exec(`DROP TABLE IF EXISTS persons`);
    await db.exec(`CREATE TABLE IF NOT EXISTS persons (
        id INTEGER PRIMARY KEY,
        name TEXT,
        age INTEGER
    )`);

    await db.exec(`CREATE TABLE IF NOT EXISTS persons2 (
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

  afterAll(() => {
    fs.unlinkSync(db_name);
  });
  
  test("sqlite basic select", () => {
    let result;
    const conn = new SqliteConnection(db_name);
    result = conn.query().from("persons").select('*').get();
    expect(result.length).toBe(10);

    result = conn.query().from("persons").select('*').where('age','>',85).get();
    expect(result.length).toBe(3);

    result = conn.query().from("persons").select('*').where('age','>',85).where('name','Person9').get();
    expect(result.length).toBe(1);

    result = conn.query().from("persons").select('*').where('age','>',25).where('age','<','85').get();
    expect(result.length).toBe(5);
  });


  test("sqlite basic select", () => {
    let result;
    const conn = new SqliteConnection(db_name);

    conn.query().from('persons2').insert({name: "meow1",age:100});
    result = conn.query().from("persons2").select('*').get();
    expect(result.length).toBe(1);
  });

  // test("raw testing", () => {
  //   let db = new Database('/tmp/database.db');

  //   let stmt = db.prepare('select *, :age from persons where age > :age');
  //   let rc = stmt.all({age: 85});
  //   console.log(rc);
  // });
});
