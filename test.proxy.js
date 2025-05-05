import https from "https";
import { HttpsProxyAgent } from "https-proxy-agent";

export async function testProxy(proxyData, attemptCount, fullReport) {
  return new Promise((resolve, reject) => {
    const proxy = proxyData.proxy;
    const proxyAgent = new HttpsProxyAgent(`http://${proxy}`);

    const options = {
      hostname: "example.com",
      port: 443,
      method: "GET",
      agent: proxyAgent,
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 200) {
        console.log(`Proxy ${proxy} funciona correctamente.`);
        fullReport.workingProxies.push({ proxy, statusCode: res.statusCode });
        fullReport.statistics.successfulVotes++;
        resolve();
      } else {
        console.log(
          `Proxy ${proxy} falló con código de estado ${res.statusCode}.`
        );
        fullReport.failedProxies.push({ proxy, statusCode: res.statusCode });
        fullReport.statistics.failedVotes++;
        resolve();
      }
    });

    req.on("error", (err) => {
      console.log(`Error al probar el proxy ${proxy}: ${err.message}`);
      fullReport.failedProxies.push({ proxy, error: err.message });
      fullReport.statistics.failedVotes++;
      reject(err);
    });

    req.on("timeout", () => {
      console.log(`Timeout al probar el proxy ${proxy}.`);
      fullReport.failedProxies.push({ proxy, error: "Timeout" });
      fullReport.statistics.failedVotes++;
      req.destroy();
      reject(new Error("Timeout"));
    });

    req.end();
  });
}
