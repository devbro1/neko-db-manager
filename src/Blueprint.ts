import { Parameter } from './types';

export type ColumnPropertiesType = {
  type:
    | 'string'
    | 'integer'
    | 'float'
    | 'double'
    | 'boolean'
    | 'char'
    | 'text'
    | 'date'
    | 'timestamp'
    | 'serial';
  length: number;
  nullable: boolean;
  unique: boolean;
  default: Parameter;
};
export class Column {
  columnName: string = '';
  properties: ColumnPropertiesType = {
    type: 'string',
    length: 255,
    nullable: false,
    unique: false,
    default: null,
  };

  constructor(columnName: string, type: ColumnPropertiesType['type']) {
    this.columnName = columnName;
    this.properties.type = type;
  }

  length(length: number) {
    this.properties.length = length;
    return this;
  }

  nullable(nullable: boolean = true) {
    this.properties.nullable = nullable;
    return this;
  }

  unique(unique: boolean = true) {
    this.properties.unique = unique;
    return this;
  }

  default(value: ColumnPropertiesType['default']) {
    this.properties.default = value;
    return this;
  }
}
export class Blueprint {
  tableName: string = '';
  columns: Column[] = [];
  existingTable: boolean = false;
  primaryKeys: string[] = [];
  constructor() {}
  setTableName(tableName: string, existingTable: boolean = false) {
    this.tableName = tableName;
    this.existingTable = existingTable;
  }

  Boolean(columnName: string) {
    const rc = new Column(columnName, 'boolean');
    this.columns.push(rc);
    return rc;
  }

  char(columnName: string) {
    const rc = new Column(columnName, 'char');
    this.columns.push(rc);
    return rc;
  }

  string(columnName: string, length: number = 255) {
    const rc = new Column(columnName, 'string');
    rc.length(length);
    this.columns.push(rc);
    return rc;
  }

  text(columnName: string) {
    const rc = new Column(columnName, 'text');
    this.columns.push(rc);
    return rc;
  }

  integer(columnName: string) {
    const rc = new Column(columnName, 'integer');
    this.columns.push(rc);
    return rc;
  }

  float(columnName: string) {
    const rc = new Column(columnName, 'float');
    this.columns.push(rc);
    return rc;
  }

  double(columnName: string) {
    const rc = new Column(columnName, 'double');
    this.columns.push(rc);
    return rc;
  }

  id() {
    const rc = new Column('id', 'serial');
    this.columns.push(rc);
    this.primaryKeys.push('id');
    return rc;
  }

  timestamps() {
    this.columns.push(new Column('created_at', 'timestamp'));
    this.columns.push(new Column('updated_at', 'timestamp'));
  }

  date(columnName: string) {
    const rc = new Column(columnName, 'date');
    this.columns.push(rc);
    return rc;
  }

  primary(keys: string[]) {
    this.primaryKeys = keys;
  }
}
