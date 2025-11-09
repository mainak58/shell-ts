import { existsSync } from "fs";
import { typeFunction } from "./type";

export const commonCallBackMap: Record<string, (args: string[]) => void> = {
  exit: () => process.exit(0),
  echo: (args) => echoFunction(...args),
  pwd: () => console.log(process.cwd()),
  type: (args) => typeFunction(args, commonCallBackMap),
  cd: (args) => {
    const targetDir =
      args.length === 0
        ? process.env.HOME
        : args[0] === "~"
        ? process.env.HOME
        : args[0];

    if (!targetDir) {
      console.error("HOME not set");
      return;
    }

    if (existsSync(targetDir)) process.chdir(targetDir);
    else console.error(`cd: ${args[0]}: No such file or directory`);
  },
};

export function echoFunction(...args: string[]): void {
  console.log(args.join(" "));
}
