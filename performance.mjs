import { readdirSync, statSync, rmSync, appendFileSync } from "node:fs";
import { execSync } from "node:child_process";

const appendLog = (log) => appendFileSync("performance.log", `${log}\n`);
rmSync("performance.log", { force: true });

const doExec = (name, lang, cwd, cmd, repeatCount) => {
  const start = process.hrtime();
  try {
    execSync(cmd, { cwd });
  } catch (e) {
    console.error(cmd, e.toString());
  }
  const [s, ns] = process.hrtime(start);
  const execTime = ((s * 1000 + ns / 1000000) / repeatCount).toFixed(3);
  const log = `[${name} / ${lang}]\t: Execution time: ${execTime} ms. (${cmd})`;
  appendLog(log);
  console.info(log);
};

const BASE_DIR = "./src";
const dirs = readdirSync(BASE_DIR).filter(
  (file) => statSync(`${BASE_DIR}/${file}`).isDirectory() && file !== "template"
);
const hasOnly = !!dirs.find((dir) => dir.endsWith(".only"));
dirs.forEach((name) => {
  if (!hasOnly || name.endsWith(".only")) {
    const dir = `${BASE_DIR}/${name}`;
    doExec(
      name,
      "java",
      dir,
      "for i in {1..50} ; do java --enable-preview InputJ ; done",
      50
    );
    try {
      execSync("java InputKKt", { cwd: dir, stdio: "ignore" });
      const cmd = "for i in {1..50} ; do java --enable-preview InputKKt ; done";
      doExec(name, "java", dir, cmd, 50);
    } catch (e) {
      const cmd = "for i in {1..50} ; do kotlin InputKKt ; done";
      doExec(name, "kt", dir, cmd, 50);
    }
  }
});
