import { findCommonPath } from "./helper";

export const typeFunction = (args: string[], builtins: Record<string, any>) => {
  if (args[0] in builtins) {
    console.log(`${args[0]} is a shell builtin`);
  } else {
    const filePath = findCommonPath(args[0]);
    if (filePath) console.log(`${args[0]} is ${filePath}`);
    else console.error(`${args[0]}: not found`);
  }
};
