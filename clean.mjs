import { readdirSync, rmSync } from "node:fs";

const BASE_DIR = "./src";
readdirSync(BASE_DIR).forEach((name) => {
  readdirSync(`${BASE_DIR}/${name}`).forEach((file) => {
    if (!file.endsWith(".java") && !file.endsWith(".kt")) {
      rmSync(`${BASE_DIR}/${name}/${file}`, { recursive: true, force: true });
    }
  });
});
