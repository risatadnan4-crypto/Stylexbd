import { createRequire } from "module";
const require = createRequire(import.meta.url);

// @ts-ignore
const pkg = require("../dist/server.cjs");
const { app } = pkg;

export default app;


