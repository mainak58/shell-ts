import { existsSync } from "fs";
import { typeFunction } from "./type";

export const commonCallBackMap: Record<string, (args: string[]) => void> = {
  exit: (_: string[]) => process.exit(0),
  echo: (args: string[]) => console.log(...args),
  pwd: (_: string[]) => console.log(process.cwd()),
  type: (args: string[]) => typeFunction(args, commonCallBackMap),
  cd: (args: string[]) => {
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
