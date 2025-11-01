import { accessSync, existsSync, constants } from "fs";

export function findCommonPath(command: string): string | null {
  const pathEnv = process.env.PATH || "";

  const directory = pathEnv.split(":");

  for (const dir of directory) {
    const filePath = `${dir}/${command}`;
    try {
      if (existsSync(filePath)) {
        accessSync(filePath, constants.X_OK);
        return filePath;
      }
    } catch (_) {}
  }
  return null;
}
