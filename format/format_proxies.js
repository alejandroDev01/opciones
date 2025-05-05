import fs from "fs";
import xlsx from "xlsx";

// Leer el archivo Excel
const workbook = xlsx.readFile("format/IPS PROXY.xlsx");
const sheetName = workbook.SheetNames[0]; // Usar la primera hoja
const sheet = workbook.Sheets[sheetName];

// Convertir la hoja a JSON
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// Dividir los proxies por protocolo
const proxiesByProtocol = {};

data.forEach((row) => {
  const proxy = row[0]; // Columna de IP:puerto
  const protocol = row[1]; // Columna de protocolo (HTTP, HTTPS, etc.)
  if (proxy && protocol) {
    if (!proxiesByProtocol[protocol]) {
      proxiesByProtocol[protocol] = [];
    }
    proxiesByProtocol[protocol].push(proxy);
  }
});

// Generar listas de 500 servidores por protocolo
Object.keys(proxiesByProtocol).forEach((protocol) => {
  const proxies = proxiesByProtocol[protocol];
  const chunks = Math.ceil(proxies.length / 500);

  for (let i = 0; i < chunks; i++) {
    const chunk = proxies.slice(i * 500, (i + 1) * 500);
    const formattedContent = `export const PROXY_LIST_${protocol}_${i + 1} = [
  ${chunk.map((proxy) => `"${proxy}"`).join(",\n  ")}
];`;

    // Guardar cada lista en un archivo separado
    const fileName = `proxy/ip/proxy_${protocol.toLowerCase()}_${i + 1}.js`;
    fs.writeFileSync(fileName, formattedContent);
    console.log(`Lista guardada en: ${fileName}`);
  }
});
