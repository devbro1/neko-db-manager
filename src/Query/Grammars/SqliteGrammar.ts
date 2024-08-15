import Str from "src/Illuminate/Str";
import { Grammar } from "./Grammar";
import str from 'src/Illuminate/Str';
import { Builder } from "../Builder";

export class SqliteGrammar extends Grammar {
    operators: string[] = [
        '=', '<', '>', '<=', '>=', '<>', '!=',
        'like', 'not like', 'ilike',
        '&', '|', '<<', '>>',
    ];

    compileLock(query: any, value: boolean | string): string {
        return '';
    }

    wrapUnion(sql: string): string {
        return `select * from (${sql})`;
    }

    whereDate(query: any, where: any): string {
        return this.dateBasedWhere('%Y-%m-%d', query, where);
    }

    whereDay(query: any, where: any): string {
        return this.dateBasedWhere('%d', query, where);
    }

    whereMonth(query: any, where: any): string {
        return this.dateBasedWhere('%m', query, where);
    }

    whereYear(query: any, where: any): string {
        return this.dateBasedWhere('%Y', query, where);
    }

    whereTime(query: any, where: any): string {
        return this.dateBasedWhere('%H:%M:%S', query, where);
    }

    dateBasedWhere(type: string, query: any, where: any): string {
        const value = this.parameter(where.value);

        return `strftime('${type}', ${this.wrap(where.column)}) ${where.operator} cast(${value} as text)`;
    }

    compileIndexHint(query: any, indexHint: any): string {
        return indexHint.type === 'force'
                ? `indexed by ${indexHint.index}`
                : '';
    }

    compileJsonLength(column: string, operator: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);

        return `json_array_length(${field}${path}) ${operator} ${value}`;
    }

    compileJsonContains(column: string, value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);
        return `exists (select 1 from json_each(${field}${path}) where ${this.wrap('json_each.value')} is ${value})`;
    }

    prepareBindingForJsonContains(binding: any): any {
        return binding; // May require JSON.stringify if dealing with objects or arrays in actual SQL parameters
    }

    compileJsonContainsKey(column: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(column);
        return `json_type(${field}${path}) is not null`;
    }

    compileGroupLimit(query: any): string {
        const version = query.getConnection().getServerVersion();
        if (parseFloat(version) >= 3.25) {
            return super.compileGroupLimit(query);
        }
        query.groupLimit = null;
        return this.compileSelect(query);
    }

    compileUpdate(query: any, values: object): string {
        if (query._joins.length || query._limit) {
            return this.compileUpdateWithJoinsOrLimit(query, values);
        }
        return super.compileUpdate(query, values);
    }

    public compileInsertOrIgnore(query: Builder, values: any[]): string {
        return Str.replaceFirst('insert', 'insert or ignore', this.compileInsert(query, values));
    }
    
    public compileInsertOrIgnoreUsing(query: Builder, columns: any[], sql: string): string {
        return Str.replaceFirst('insert', 'insert or ignore', this.compileInsertUsing(query, columns, sql));
    }

    compileUpdateColumns(query: any, values: object): string {
        const jsonGroups = this.groupJsonColumnsForUpdate(values);
        let rc = Object.entries(values).filter(([key]) => !this.isJsonSelector(key))
            .concat(Object.entries(jsonGroups))
            .map((mm) => {
                console.log(mm);
                let key = mm[1].bindings;
                let value = mm[1].value;
                const column = key.split('.').pop();
                // @ts-ignore
                value = jsonGroups[key] ? this.compileJsonPatch(column, value) : this.parameter(value);
                // @ts-ignore
                return `${this.wrap(column)} = ${value}`;
            })
            .join(', ');

        return rc;
    }

    wrapJsonFieldAndPath(column: string): [string, string] {
        const segments = column.split('->');
        const field = this.wrap(segments.shift() ?? '');
        const path = segments.length ? `'$.${segments.join('.')}'` : '';
        return [field, path];
    }

    compileUpsert(query: any, values: object, uniqueBy: string[], update: object): string {
        let sql = this.compileInsert(query, [values]);
        sql += ` on conflict (${this.columnize(uniqueBy)}) do update set `;

        const columns = Object.entries(update).map(([key, value]) => {
            if (typeof key === 'number') {
                return `${this.wrap(value)} = excluded.${this.wrap(value)}`;
            } else {
                return `${this.wrap(key)} = ${this.parameter(value)}`;
            }
        }).join(', ');

        return sql + columns;
    }

    groupJsonColumnsForUpdate(values: object): object {
        const groups: { [key: string]: any } = {};

        for (const [key, value] of Object.entries(values)) {
            if (this.isJsonSelector(key)) {
                groups[key.replace(/->/g, '.')] = value;
            }
        }

        return groups;
    }

    compileJsonPatch(column: string, value: any): string {
        return `json_patch(ifnull(${this.wrap(column)}, json('{}')), json(${this.parameter(value)}))`;
    }

    compileUpdateWithJoinsOrLimit(query: any, values: object): string {
        const table = this.wrapTable(query._from);
        const columns = this.compileUpdateColumns(query, values);
        const alias = query._from.split(/\s+as\s+/i).pop();
        const selectSql = this.compileSelect(query.select(`${alias}.rowid`));

        return `update ${table} set ${columns} where ${this.wrap('rowid')} in (${selectSql})`;
    }

    compileDeleteWithJoinsOrLimit(query: any): string {
        const table = this.wrapTable(query.from);
        const alias = query.from.split(/\s+as\s+/i).pop();
        const selectSql = this.compileSelect(query.select(`${alias}.rowid`));

        return `delete from ${table} where ${this.wrap('rowid')} in (${selectSql})`;
    }

    compileTruncate(query: any): object {
        return {
            [`delete from sqlite_sequence where name = ?`]: [this.getTablePrefix() + query.from],
            [`delete from ${this.wrapTable(query.from)}`]: [],
        };
    }

    wrapJsonSelector(value: string): string {
        const [field, path] = this.wrapJsonFieldAndPath(value);
        return `json_extract(${field}${path})`;
    }

    isJsonSelector(key: string): boolean {
        return key.includes('->');
    }
}