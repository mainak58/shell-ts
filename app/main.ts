import { spawn } from "child_process";
import { createInterface } from "readline";

import { commonCallBackMap } from "./utils";
import { findCommonPath } from "./helper";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function executeProgramme(
  commandPath: string,
  commandName: string,
  args: string[]
): Promise<void> {
  return new Promise((resolve) => {
    const childProcess = spawn(commandPath, args, {
      stdio: "inherit",
      argv0: commandName,
    });

    childProcess.on("close", () => {
      resolve();
    });
  });
}

function parseCommandLine(input: string): { cmd: string; args: string[] } {
  const tokens: string[] = [];
  let current = "";
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escaping = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === "\\" && !inSingleQuote) {
      // In double quotes: only escape " and \ (for now)
      if (inDoubleQuote) {
        const next = input[i + 1];
        if (next === '"' || next === "\\") {
          i++;
          current += next;
          continue;
        }
      } else {
        // Outside quotes: escape next character literally
        escaping = true;
        continue;
      }
    }

    if (!inSingleQuote && !inDoubleQuote && /\s/.test(char)) {
      if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) tokens.push(current);

  const [cmd, ...args] = tokens;
  return { cmd, args };
}

const main = async () => {
  while (true) {
    const answer = await new Promise<string>((resolve) => {
      rl.question("$ ", (answer) => {
        resolve(answer);
      });
    });

    const { cmd, args } = parseCommandLine(answer.trim());

    if (cmd in commonCallBackMap) {
      commonCallBackMap[cmd](args);
    } else {
      const commandPath = findCommonPath(cmd);
      if (commandPath) {
        await executeProgramme(commandPath, cmd, args);
      } else {
        console.log(`${cmd}: command not found`);
      }
    }
  }
};

main();
