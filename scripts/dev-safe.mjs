import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

const lockPath = path.join(process.cwd(), ".next", "dev", "lock");

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isProcessAlive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

const readCmdline = async (pid) => {
  try {
    const cmdline = await readFile(`/proc/${pid}/cmdline`, "utf8");
    return cmdline.replace(/\u0000/g, " ").trim();
  } catch {
    return "";
  }
};

const terminateStaleNextFromLock = async () => {
  let lock;

  try {
    lock = JSON.parse(await readFile(lockPath, "utf8"));
  } catch {
    return;
  }

  const pid = Number(lock?.pid);
  if (!Number.isInteger(pid) || pid <= 0 || pid === process.pid) {
    return;
  }

  if (!isProcessAlive(pid)) {
    return;
  }

  const cmdline = await readCmdline(pid);
  const looksLikeNext = cmdline.includes("next-server") || cmdline.includes("next dev");
  if (!looksLikeNext) {
    return;
  }

  process.kill(pid, "SIGTERM");
  await sleep(1200);

  if (isProcessAlive(pid)) {
    process.kill(pid, "SIGKILL");
  }
};

await terminateStaleNextFromLock();

const nextBin = path.join(process.cwd(), "node_modules", ".bin", "next");
const child = spawn(nextBin, ["dev"], { stdio: "inherit" });

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
