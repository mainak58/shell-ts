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

const main = async () => {
  while (true) {
    const answer = await new Promise<string>((resolve) => {
      rl.question("$ ", (answer) => {
        resolve(answer);
      });
    });

    const [cmd, ...args] = answer.trim().split(" ");

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
