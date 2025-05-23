import { Request, Response } from "neko-router/src/types";
import { router } from "./facades";
import { wait } from "neko-helper/src/time";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import { ctx } from "neko-http/src";
import { Connection } from "neko-sql/src/Connection";


// load database connection
router.addGlobalMiddleware(DatabaseServiceProvider);

router.addGlobalMiddleware(
  async (req: Request, res: Response, next: () => Promise<void>) => {
    console.log("route:", req.url);
    console.log("context", ctx().keys());
    await next();
  },
);
router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/countries",
  async (req: any, res: any) => {
    return { yey: "GET countries" };
  },
);

router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/regions",
  async (req: any, res: any) => {
    return { yey: "GET regions" };
  },
);

/*
CREATE TABLE cats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
);
*/
router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/time",
  async (req: Request, res: Response) => {
    console.log("GET time", req?.query?.wait, ctx().get("requestId"));

    await wait(parseInt(req?.query?.wait || "") || 0);
    console.log("waited", req?.query?.wait);

    let db = ctx().getOrThrow<Connection>("db");
    let error = undefined;
    try {
      await db.beginTransaction();
      await db.runQuery({
        sql: "insert into cats (name) values ($1)",
        bindings: [req?.query?.name as string],
      });
      console.log("inserted", req?.query?.name);
      await db.commit();
      error = "success";
    } catch (err) {
      await db.rollback();
      error = "FAILED";
      res.statusCode = 500;
    }

    console.log("FIN time", req?.query?.wait);
    // @ts-ignore
    let dd = req.context.dd;
    return { yey: "GET time", time: new Date().toISOString(), error, dd };
  },
);

router.addRoute(
  ["GET", "HEAD"],
  "/api/v1/part2",
  async (req: Request, res: Response) => {
    return { yey: "GET part2" };
  },
);
