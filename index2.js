import https from "https";
import fs from "fs";
import { faker } from "@faker-js/faker";
// import { PROXY_LIST_HTTP as PROXY_LIST } from "./proxy/ip/proxy_http (mikrotik)_2.js";
import { HttpsProxyAgent } from "https-proxy-agent";

const timestamp = new Date().getTime();
const reportFile = `report-${timestamp}.json`;

const PROXY_LIST = ["85.208.200.185:8081"];

const fullReport = {
  metadata: {
    startTime: new Date().toISOString(),
    totalProxies: PROXY_LIST.length,
    description: "Reporte completo de votaciones con proxies",
  },
  workingProxies: [],
  failedProxies: [],
  votingAttempts: [],
  statistics: {
    totalAttempts: 0,
    successfulVotes: 0,
    failedVotes: 0,
    workingProxyCount: 0,
    failedProxyCount: 0,
    successRate: "0%",
  },
};

// Guardar el reporte en cada iteración
function saveReport() {
  fs.writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));
}

// Seleccionar un proxy aleatorio de la lista
function getRandomProxy() {
  const untestedProxies = PROXY_LIST.filter(
    (proxy) =>
      !fullReport.workingProxies.some((p) => p.proxy === proxy) &&
      !fullReport.failedProxies.some((p) => p.proxy === proxy)
  );

  if (untestedProxies.length === 0) return null;

  const proxy =
    untestedProxies[Math.floor(Math.random() * untestedProxies.length)];
  const fullProxyUrl = proxy.startsWith("http") ? proxy : `http://${proxy}`;
  const proxyAgent = new HttpsProxyAgent(fullProxyUrl);
  const proxyIp = new URL(fullProxyUrl).hostname;
  return { proxyAgent, proxyIp, proxy };
}

// Generar coordenadas aleatorias en Bolivia
function getRandomBolivianCoordinates() {
  const lat = faker.number.float({
    min: -22.9,
    max: -9.6,
    precision: 0.000001,
  });
  const lng = faker.number.float({
    min: -69.6,
    max: -57.5,
    precision: 0.000001,
  });
  return { lat, lng };
}

// Enviar un voto
async function sendVote(proxyAgent, proxyIp, proxy, attempt, voteNumber) {
  return new Promise((resolve, reject) => {
    const fakeIp = faker.internet.ipv4();
    const coords = getRandomBolivianCoordinates();

    const params = new URLSearchParams({
      latitud: coords.lat,
      longitud: coords.lng,
      recapicha_token: "",
      pals: "Bolivia",
      ciudad: "Cochabamba",
      candidato: "Manfred+Reyes+Villa",
    });

    const options = {
      hostname:
        "segunda-votacion-daebgzdjhfc5fjbd.centralus-01.azurewebsites.net",
      path: "/enviar_voto_modificado_final",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(params.toString()),
        "X-Forwarded-For": proxyIp,
        "X-Real-IP": proxyIp,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      agent: proxyAgent,
      timeout: 10000,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const result = {
          attempt,
          voteNumber,
          fakeIp,
          proxyUsed: proxy,
          coordinates: coords,
          statusCode: res.statusCode,
          response: data,
          timestamp: new Date().toISOString(),
          success: res.statusCode === 200,
        };

        fullReport.votingAttempts.push(result);
        fullReport.statistics.totalAttempts++;

        if (result.success) {
          fullReport.statistics.successfulVotes++;
        } else {
          fullReport.statistics.failedVotes++;
        }

        resolve(result);
      });
    });

    req.on("error", (e) => {
      const errorResult = {
        attempt,
        voteNumber,
        proxyUsed: proxy,
        error: e.message,
        timestamp: new Date().toISOString(),
        success: false,
      };

      fullReport.votingAttempts.push(errorResult);
      fullReport.statistics.totalAttempts++;
      fullReport.statistics.failedVotes++;

      reject(e);
    });

    req.setTimeout(10000, () => {
      const timeoutResult = {
        attempt,
        voteNumber,
        proxyUsed: proxy,
        error: "Timeout",
        timestamp: new Date().toISOString(),
        success: false,
      };

      fullReport.votingAttempts.push(timeoutResult);
      fullReport.statistics.totalAttempts++;
      fullReport.statistics.failedVotes++;

      req.destroy();
      reject(new Error(`Timeout for proxy: ${proxy}`));
    });

    req.write(params.toString());
    req.end();
  });
}

// Probar un proxy y enviar votos
async function testProxy(proxyData, attempt) {
  const { proxyAgent, proxyIp, proxy } = proxyData;
  let successfulVotes = 0;
  const maxVotesPerProxy = 3;

  try {
    // Intento inicial
    const initialResult = await sendVote(
      proxyAgent,
      proxyIp,
      proxy,
      attempt,
      1
    );

    if (initialResult.success) {
      successfulVotes++;

      // Intentos adicionales si el primero fue exitoso
      for (let i = 2; i <= maxVotesPerProxy; i++) {
        try {
          const result = await sendVote(proxyAgent, proxyIp, proxy, attempt, i);
          if (result.success) successfulVotes++;
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          console.error(
            `Error in vote ${i} with proxy ${proxy}:`,
            error.message
          );
        }
      }

      // Registrar proxy exitoso
      fullReport.workingProxies.push({
        proxy,
        successfulVotes,
        totalAttempts: maxVotesPerProxy,
        successRate: `${((successfulVotes / maxVotesPerProxy) * 100).toFixed(
          1
        )}%`,
        firstSuccess: initialResult.timestamp,
        lastAttempt: new Date().toISOString(),
      });
      fullReport.statistics.workingProxyCount++;
    } else {
      // Registrar proxy fallido
      fullReport.failedProxies.push({
        proxy,
        error: initialResult.error || `HTTP ${initialResult.statusCode}`,
        timestamp: initialResult.timestamp,
        attempt,
      });
      fullReport.statistics.failedProxyCount++;
    }

    return successfulVotes;
  } catch (error) {
    // Registrar proxy fallido por error
    fullReport.failedProxies.push({
      proxy,
      error: error.message,
      timestamp: new Date().toISOString(),
      attempt,
    });
    fullReport.statistics.failedProxyCount++;

    throw error;
  }
}

// Ejecutar el proceso de votación
async function runVotingProcess() {
  console.log("Starting voting process...");
  console.log(`Full report will be saved in: ${reportFile}`);

  let remainingProxies = PROXY_LIST.length;
  let attemptCount = 0;

  while (remainingProxies > 0) {
    const proxyData = getRandomProxy();
    if (!proxyData) {
      console.log("All proxies have been tested");
      break;
    }

    console.log(
      `Testing proxy ${proxyData.proxy} (${remainingProxies} remaining)`
    );
    attemptCount++;

    try {
      await testProxy(proxyData, attemptCount);
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Error testing proxy ${proxyData.proxy}:`, error.message);
    }

    remainingProxies =
      PROXY_LIST.length -
      fullReport.workingProxies.length -
      fullReport.failedProxies.length;
  }

  // Calcular estadísticas finales
  fullReport.metadata.endTime = new Date().toISOString();
  fullReport.metadata.duration = `${
    new Date(fullReport.metadata.endTime) -
    new Date(fullReport.metadata.startTime)
  }ms`;

  fullReport.statistics.successRate = `${(
    (fullReport.statistics.successfulVotes /
      fullReport.statistics.totalAttempts) *
    100
  ).toFixed(2)}%`;
  fullReport.statistics.proxySuccessRate = `${(
    (fullReport.workingProxies.length / PROXY_LIST.length) *
    100
  ).toFixed(2)}%`;

  // Ordenar los resultados
  fullReport.workingProxies.sort(
    (a, b) => b.successfulVotes - a.successfulVotes
  );
  fullReport.failedProxies.sort((a, b) => a.proxy.localeCompare(b.proxy));
  fullReport.votingAttempts.sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // Guardar el reporte completo
  fs.writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));

  // Mostrar resumen
  console.log("\n===== VOTING PROCESS COMPLETED =====");
  console.log(`Total proxies tested: ${PROXY_LIST.length}`);
  console.log(`Working proxies: ${fullReport.workingProxies.length}`);
  console.log(`Failed proxies: ${fullReport.failedProxies.length}`);
  console.log(`Total votes attempted: ${fullReport.statistics.totalAttempts}`);
  console.log(`Successful votes: ${fullReport.statistics.successfulVotes}`);
  console.log(`Failed votes: ${fullReport.statistics.failedVotes}`);
  console.log(`Success rate: ${fullReport.statistics.successRate}`);
  console.log(`Proxy success rate: ${fullReport.statistics.proxySuccessRate}`);
  console.log(`Full report saved to: ${reportFile}`);
}

runVotingProcess();
