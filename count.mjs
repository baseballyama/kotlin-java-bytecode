import {
  readdirSync,
  statSync,
  rmSync,
  appendFileSync,
  readFileSync,
} from "node:fs";

const normalize = (text) => {
  return text
    .replaceAll(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\/\/.*/, "").replaceAll(/\s/g, ""))
    .join("");
};

const countFile = (filePath, name, lang) => {
  const text = readFileSync(filePath, "utf-8");
  const { length } = normalize(text);
  const log = `[${name} / ${lang}]\t: count: ${length} chars`;
  appendLog(log);
  console.info(log);
  return length;
};

const appendLog = (log) => appendFileSync("count.log", `${log}\n`);

rmSync("count.log", { force: true });

const BASE_DIR = "./src";
const dirs = readdirSync(BASE_DIR).filter(
  (file) => statSync(`${BASE_DIR}/${file}`).isDirectory() && file !== "template"
);

let javaLength = 0;
let kotlinLength = 0;

const hasOnly = !!dirs.find((dir) => dir.endsWith(".only"));
dirs.forEach((name) => {
  if (!hasOnly || name.endsWith(".only")) {
    const dir = `${BASE_DIR}/${name}`;
    readdirSync(`${BASE_DIR}/${name}`).forEach((file) => {
      if (file.endsWith(".java")) {
        javaLength += countFile(`${dir}/${file}`, name, "java");
      } else if (file.endsWith(".kt")) {
        kotlinLength += countFile(`${dir}/${file}`, name, "kt");
      }
    });
  }
});

const percent = (((javaLength - kotlinLength) * 100) / javaLength).toFixed(0);
const message = `Kotlin's length of code is ${percent}% less than java.`;
console.log(message);
appendLog(message);
