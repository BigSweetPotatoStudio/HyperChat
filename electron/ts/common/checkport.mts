import net from "net";

// 要检查的端口
export async function isPortUse(port: number): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        // 端口已经被使用
        console.log(`Port ${port} is already in use.`);
        resolve(true);
      } else {
        console.log(err);
        reject(err);
      }
    });

    server.once("listening", () => {
      // 端口未被使用
      // console.log(`Port ${port} is available.`);
      server.close();
      resolve(false);
    });

    try {
      server.listen(port);
    } catch (e) {
      console.log(e);
    }
  });
}
