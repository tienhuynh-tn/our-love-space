import { spawn } from "node:child_process";

// Use a production server so the user's running dev server remains undisturbed.
const build = spawn(process.execPath,["node_modules/next/dist/bin/next","build","--webpack"],{ stdio: "inherit" });
let server;
for (const signal of ["SIGINT","SIGTERM"]) process.on(signal,() => { build.kill(signal);server?.kill(signal); });
build.on("exit",code => {
  if (code !== 0) { process.exit(code ?? 1);return; }
  server = spawn(process.execPath,["node_modules/next/dist/bin/next","start","--hostname","127.0.0.1","--port","3108"],{ stdio: "inherit" });
  server.on("exit",status => process.exit(status ?? 0));
});
