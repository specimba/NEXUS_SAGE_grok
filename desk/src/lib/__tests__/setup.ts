/** bun test preload (desk/bunfig.toml): one global afterAll removes every scratch dir the suite made. */
import { afterAll } from "bun:test";
import { cleanupTmp } from "./tmp-cache";

afterAll(cleanupTmp);
