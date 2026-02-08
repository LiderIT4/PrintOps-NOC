const { exec } = require('child_process');
const path = require('path');

const PORT = 4000;

function killPort(port) {
    return new Promise((resolve, reject) => {
        const command = `netstat -ano | findstr :${port}`;
        exec(command, (err, stdout, stderr) => {
            if (err || !stdout) {
                console.log(`No process found on port ${port}`);
                return resolve();
            }

            const lines = stdout.trim().split('\n');
            const pids = lines.map(line => line.trim().split(/\s+/).pop()).filter(pid => /^\d+$/.test(pid));

            if (pids.length === 0) return resolve();

            // Unique PIDs
            const uniquePids = [...new Set(pids)];
            console.log(`Killing PIDs: ${uniquePids.join(', ')}`);

            let killedCount = 0;
            uniquePids.forEach(pid => {
                exec(`taskkill /PID ${pid} /F`, (kErr) => {
                    if (kErr) console.log(`Failed to kill ${pid}: ${kErr.message}`);
                    else console.log(`Killed ${pid}`);

                    killedCount++;
                    if (killedCount === uniquePids.length) resolve();
                });
            });
        });
    });
}

killPort(PORT).then(() => {
    console.log('Starting server...');
    const spawn = require('child_process').spawn;
    const server = spawn('node', ['index.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    server.on('error', (err) => {
        console.error('Failed to start server:', err);
    });
});
