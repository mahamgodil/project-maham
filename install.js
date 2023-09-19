"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.installDependencies = void 0;
const { execSync } = require('child_process');
function installDependencies() {
    try {
        console.log("Installing dependencies...");
        execSync('npm install', { stdio: 'inherit' });
        console.log("Dependencies installed successfully");
        process.exit(0);
    }
    catch (error) {
        console.log("Dependency installation failed:");
        process.exit(1);
    }
}
exports.installDependencies = installDependencies;
