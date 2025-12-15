const { spawn } = require("child_process");
const gradient = require("gradient-string");
const { retro } = gradient;
const axios = require("axios");

/*
  WARNING: This source code is created by Liane Cagara.
  Any unauthorized modifications or attempts to tamper with this code 
  can result in severe consequences, including a global ban from my server.
  Proceed with extreme caution and refrain from any unauthorized actions.
*/

// ==================== CASSIDY BOT PROCESS ====================
let cassidyProcess = null;
let cassidyRestartCount = 0;
const MAX_RESTARTS = 10;

function runChildProcess() {
  console.log(retro("🚀 Starting Cassidy Bot..."));
  
  cassidyProcess = spawn("node", ["spawner.js"], {
    shell: true,
    stdio: "pipe",
    env: { 
      ...process.env,
      NODE_NO_WARNINGS: "1"  // Node warnings suppress
    }
  });

  cassidyProcess.stdout.on("data", (data) => {
    const output = retro(data.toString());
    process.stdout.write(output);
  });

  cassidyProcess.stderr.on("data", (data) => {
    const errorOutput = data.toString();
    
    // Check for duplexify/websocket errors
    if (errorOutput.includes("duplexify") || 
        errorOutput.includes("ending") ||
        errorOutput.includes("websocket-stream")) {
      console.log(retro("⚠️  WebSocket connection issue detected..."));
    }
    
    const output = retro(errorOutput);
    process.stderr.write(output);
  });

  cassidyProcess.on("close", (code, signal) => {
    console.log(retro(`🔴 Cassidy exited with code ${code} | Signal: ${signal || 'N/A'}`));
    
    // Restart logic with cooldown
    if (code !== 0 && cassidyRestartCount < MAX_RESTARTS) {
      cassidyRestartCount++;
      console.log(retro(`🔄 Restarting Cassidy (Attempt ${cassidyRestartCount}/${MAX_RESTARTS})...`));
      
      // Exponential backoff: 2^attempt seconds
      const delay = Math.min(1000 * Math.pow(2, cassidyRestartCount), 30000);
      
      setTimeout(() => {
        runChildProcess();
      }, delay);
    } else if (cassidyRestartCount >= MAX_RESTARTS) {
      console.log(retro("❌ Max restart attempts reached for Cassidy. Manual restart required."));
    }
  });

  cassidyProcess.on("error", (err) => {
    console.log(retro(`💥 Cassidy process error: ${err.message}`));
  });
}

// ==================== DISCORD BOT PROCESS ====================
let discordProcess = null;
let discordRestartCount = 0;

function runChildProcess2() {
  console.log(retro("🚀 Starting Discord Bot..."));
  
  discordProcess = spawn("node", ["setupAutoDis.js"], {
    shell: true,
    stdio: "pipe",
    env: { 
      ...process.env,
      NODE_NO_WARNINGS: "1"
    }
  });

  discordProcess.stdout.on("data", (data) => {
    const output = retro(data.toString());
    process.stdout.write(output);
  });

  discordProcess.stderr.on("data", (data) => {
    const errorOutput = data.toString();
    
    // Check for duplexify/websocket errors
    if (errorOutput.includes("duplexify") || 
        errorOutput.includes("ending") ||
        errorOutput.includes("websocket-stream")) {
      console.log(retro("⚠️  Discord WebSocket issue detected..."));
    }
    
    const output = retro(errorOutput);
    process.stderr.write(output);
  });

  discordProcess.on("close", (code, signal) => {
    console.log(retro(`🔴 Discord exited with code ${code} | Signal: ${signal || 'N/A'}`));
    
    if (code !== 0 && discordRestartCount < MAX_RESTARTS) {
      discordRestartCount++;
      console.log(retro(`🔄 Restarting Discord (Attempt ${discordRestartCount}/${MAX_RESTARTS})...`));
      
      const delay = Math.min(1000 * Math.pow(2, discordRestartCount), 30000);
      
      setTimeout(() => {
        runChildProcess2();
      }, delay);
    } else if (discordRestartCount >= MAX_RESTARTS) {
      console.log(retro("❌ Max restart attempts reached for Discord. Manual restart required."));
    }
  });

  discordProcess.on("error", (err) => {
    console.log(retro(`💥 Discord process error: ${err.message}`));
  });
}

// ==================== CLEAN SHUTDOWN HANDLER ====================
process.on('SIGINT', () => {
  console.log(retro("\n🛑 Shutting down gracefully..."));
  
  if (cassidyProcess) {
    cassidyProcess.kill('SIGTERM');
  }
  if (discordProcess) {
    discordProcess.kill('SIGTERM');
  }
  
  setTimeout(() => {
    process.exit(0);
  }, 2000);
});

// ==================== START BOTH PROCESSES ====================
console.log(retro("========================================="));
console.log(retro("🤖 CAS MULTIPLE BOT SYSTEM STARTING..."));
console.log(retro("========================================="));

// Start with 2 second delay between them
setTimeout(() => {
  runChildProcess();
}, 1000);

setTimeout(() => {
  runChildProcess2();
}, 3000);

// Keep-alive ping
setInterval(async () => {
  try {
    await axios.get(`http://localhost:3000`, { timeout: 5000 });
  } catch (err) {
    // Silent fail - just keep trying
  }
}, 15000);