import { createWriteStream } from "fs";
import readline from "readline";
import { spawn } from "child_process";
import { findCommonPath } from "./helper";
import { commonCallBackMap } from "./utils";

const builtins = ["echo", "exit", "type", "pwd", "cd"];

function completer(line: string): [string[], string] {
  const completions = builtins;
  const split = line.trim().split(/\s+/);

  if (split.length === 1) {
    const hits = completions
      .filter((cmd) => cmd.startsWith(split[0]))
      .map((cmd) => cmd + " ");
    return [hits.length ? hits : completions.map((c) => c + " "), line];
  }

  return [[], line];
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true,
  completer,
});

function executeProgramme(
  commandPath: string,
  commandName: string,
  args: string[],
  outputFile?: string,
  errorFile?: string,
  appendOutput?: boolean,
  appendError?: boolean
): Promise<void> {
  return new Promise((resolve) => {
    const stdio: any = ["inherit", "pipe", "pipe"];

    const child = spawn(commandPath, args, {
      stdio,
      argv0: commandName,
    });

    // stdout redirection
    if (outputFile) {
      const outStream = createWriteStream(outputFile, {
        flags: appendOutput ? "a" : "w",
      });
      child.stdout.pipe(outStream);
    } else {
      child.stdout.pipe(process.stdout);
    }

    // stderr redirection
    if (errorFile) {
      const errStream = createWriteStream(errorFile, {
        flags: appendError ? "a" : "w",
      });
      child.stderr.pipe(errStream);
    } else {
      child.stderr.pipe(process.stderr);
    }

    child.on("close", () => resolve());
  });
}

function parseCommand(input: string): { cmd: string; args: string[] } {
  const tokens: string[] = [];
  let current = "";
  let inSingle = false;
  let inDouble = false;
  let escaping = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (escaping) {
      current += ch;
      escaping = false;
      continue;
    }

    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }

    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }

    if (ch === "\\" && !inSingle) {
      if (inDouble) {
        const next = input[i + 1];
        if (next === '"' || next === "\\") {
          i++;
          current += next;
          continue;
        }
      } else {
        escaping = true;
        continue;
      }
    }

    if (!inSingle && !inDouble && /\s/.test(ch)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += ch;
  }

  if (current) tokens.push(current);

  const [cmd, ...args] = tokens;
  return { cmd, args };
}

const main = async () => {
  while (true) {
    const input = await new Promise<string>((resolve) => {
      rl.question("$ ", resolve);
    });

    if (!input.trim()) continue;
    let trimmed = input.trim();

    let outputFile: string | undefined;
    let errorFile: string | undefined;
    let appendOutput = false;
    let appendError = false;

    const appendOutMatch = trimmed.match(/(?:^|\s)(?:1?>>|>>)\s*([^\s]+)$/);
    if (appendOutMatch) {
      outputFile = appendOutMatch[1];
      appendOutput = true;
      trimmed = trimmed.replace(/(?:^|\s)(?:1?>>|>>)\s*[^\s]+$/, "").trim();
    }

    const outMatch = trimmed.match(/(?:^|\s)(?:1?>)\s*([^\s]+)$/);
    if (outMatch && !appendOutput) {
      outputFile = outMatch[1];
      trimmed = trimmed.replace(/(?:^|\s)(?:1?>)\s*[^\s]+$/, "").trim();
    }

    const appendErrMatch = trimmed.match(/(?:^|\s)2>>\s*([^\s]+)$/);
    if (appendErrMatch) {
      errorFile = appendErrMatch[1];
      appendError = true;
      trimmed = trimmed.replace(/(?:^|\s)2>>\s*[^\s]+$/, "").trim();
    }

    const errMatch = trimmed.match(/(?:^|\s)2>\s*([^\s]+)$/);
    if (errMatch && !appendError) {
      errorFile = errMatch[1];
      trimmed = trimmed.replace(/(?:^|\s)2>\s*[^\s]+$/, "").trim();
    }

    const { cmd, args } = parseCommand(trimmed);

    if (cmd in commonCallBackMap) {
      const origLog = console.log;
      const origErr = console.error;

      if (outputFile) {
        const outStream = createWriteStream(outputFile, {
          flags: appendOutput ? "a" : "w",
        });
        console.log = (...msg) => outStream.write(msg.join(" ") + "\n");
      }
      if (errorFile) {
        const errStream = createWriteStream(errorFile, {
          flags: appendError ? "a" : "w",
        });
        console.error = (...msg) => errStream.write(msg.join(" ") + "\n");
      }

      commonCallBackMap[cmd](args);

      console.log = origLog;
      console.error = origErr;
    } else {
      const path = findCommonPath(cmd);
      if (path) {
        await executeProgramme(
          path,
          cmd,
          args,
          outputFile,
          errorFile,
          appendOutput,
          appendError
        );
      } else {
        console.error(`${cmd}: command not found`);
      }
    }
  }
};

main();
