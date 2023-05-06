import {DB} from "@event-engine/infrastructure/Postgres/DB";
import {Pool} from "pg";
import {env} from "@server/environments/environment.current";

let db: DB;

export const getConfiguredDB = (): DB => {
  if(!db) {
    db = new DB(new Pool(env.postgres))
  }

  return db;
}
