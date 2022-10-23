import { readdirSync, statSync, rmSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";
import "./clean.mjs";

export const doExec = (cwd, cmd, name, lang, measure, appendLog) => {
  const start = process.hrtime();
  try {
    execSync(cmd, { cwd });
  } catch (e) {
    console.error(cmd, e.toString());
  }
  const [s, ns] = process.hrtime(start);
  if (measure) {
    const execTime = (s * 1000 + ns / 1000000).toFixed(3);
    const log = `[${name} / ${lang}]\t: Compile time: ${execTime} ms`;
    appendLog(log);
    console.info(log);
  }
};

const appendLog = (log) => appendFileSync("compile.log", `${log}\n`);

rmSync("compile.log", { force: true });

const BASE_DIR = "./src";
const dirs = readdirSync(BASE_DIR).filter(
  (file) => statSync(`${BASE_DIR}/${file}`).isDirectory() && file !== "template"
);

const hasOnly = !!dirs.find((dir) => dir.endsWith(".only"));
dirs.forEach((name) => {
  if (!hasOnly || name.endsWith(".only")) {
    const dir = `${BASE_DIR}/${name}`;
    readdirSync(`${BASE_DIR}/${name}`).forEach((file) => {
      if (file.endsWith(".java")) {
        doExec(dir, `javac ${file}`, name, "java", true, appendLog);
      } else if (file.endsWith(".kt")) {
        doExec(dir, `kotlinc ${file}`, name, "kt", true, appendLog);
      }
    });

    rmSync(`${dir}/META-INF`, { recursive: true, force: true });
    readdirSync(`${BASE_DIR}/${name}`).forEach((file) => {
      if (file.endsWith(".class")) {
        doExec(
          dir,
          `javap -v -p ${file.replaceAll("$", "\\$")} > ${file
            .replaceAll("$", "\\$")
            .replace(".class", "")}.bytecode`,
          name,
          "java",
          false,
          appendLog
        );
      }
    });
  }
});
