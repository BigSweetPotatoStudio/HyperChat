import { exec } from 'child_process';

export function closePort(port: number) {

    // 查找占用端口的进程ID
    exec(`netstat -ano | findstr :${port}`, (err, stdout, stderr) => {
        if (err) {
            console.error(`查找端口失败: ${err.message}`);
            return;
        }

        if (stderr) {
            console.error(`查找端口时出现错误: ${stderr}`);
            return;
        }

        // 解析出进程ID (PID)
        const lines = stdout.trim().split('\n');
        const listeningLines = lines.filter(line => line.includes('LISTENING'));
        const pids = listeningLines.map(line => line.trim().split(/\s+/).pop()).filter(pid => pid && pid !== '0');

        if (pids.length === 0) {
            console.log(`端口 ${port} 上没有运行的进程。`);
            return;
        }
        console.log(pids)
        // 终止进程
        pids.forEach(pid => {
            exec(`taskkill /PID ${pid} /F`, (err, stdout, stderr) => {
                if (err) {
                    console.error(`终止进程失败: ${err.message}`);
                    return;
                }

                if (stderr) {
                    console.error(`终止进程时出现错误: ${stderr}`);
                    return;
                }

                console.log(`成功终止了PID为 ${pid} 的进程。`);
            });
        });
    });
}