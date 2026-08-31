import { createRequire } from "module";
const require = createRequire(import.meta.url);

let appInstance: any = null;

export default async function handler(req: any, res: any) {
  if (!appInstance) {
    // @ts-ignore
    const pkg = require("../dist/server.cjs");
    appInstance = pkg.app || pkg.default || pkg;
  }
  return appInstance(req, res);
}
