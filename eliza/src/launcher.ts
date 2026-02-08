import { spawn } from "bun";

/**
 * AEGIS MISSION CONTROL LAUNCHER
 * 
 * Spawns the Vite frontend and the Bun backend in parallel.
 * This avoids the Node.js ERR_REQUIRE_ESM issues by staying 
 * entirely within the Bun ecosystem.
 */

console.log("🚀 STARTING AEGIS MISSION CONTROL...");

const backend = spawn(["bun", "src/server.ts"], {
    stdout: "inherit",
    stderr: "inherit",
});

const frontend = spawn(["bun", "./node_modules/vite/bin/vite.js"], {
    stdout: "inherit",
    stderr: "inherit",
});

process.on("SIGINT", () => {
    backend.kill();
    frontend.kill();
    process.exit();
});

console.log("\n✅ Systems active. Access the dashboard at http://localhost:5173\n");
