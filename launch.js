const { spawn } = require('child_process');
const path = require('path');

async function launch() {
    const env = { ...process.env };
    // EXPLICITLY delete this to avoid Node mode
    delete env.ELECTRON_RUN_AS_NODE;

    const electronPath = path.join(process.cwd(), 'node_modules', 'electron', 'dist', 'electron.exe');
    const mainPath = path.join(process.cwd(), 'main_process', 'main.js');

    console.log('Launching Electron...');
    console.log('Binary:', electronPath);
    console.log('App:', mainPath);

    const child = spawn(electronPath, [mainPath], {
        env,
        stdio: 'inherit',
        windowsHide: false
    });

    child.on('close', (code) => {
        process.exit(code);
    });
}

launch().catch(err => {
    console.error('Launch failed:', err);
    process.exit(1);
});
