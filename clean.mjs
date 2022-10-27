import { readdirSync, rmSync } from "node:fs";

const BASE_DIR = "./src";
readdirSync(BASE_DIR).forEach((name) => {
  if (!name.endsWith(".skip")) {
    readdirSync(`${BASE_DIR}/${name}`).forEach((file) => {
      if (
        !file.endsWith(".java") &&
        !file.endsWith(".kt") &&
        !file.endsWith(".memo.bytecode")
      ) {
        rmSync(`${BASE_DIR}/${name}/${file}`, { recursive: true, force: true });
      }
    });
  }
});
