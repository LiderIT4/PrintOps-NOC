const snmp = require("net-snmp");

const ip = "172.16.111.2";
// Probamos múltiples variantes para Mono/Color
const oids = [
  "1.3.6.1.2.1.43.10.2.1.4.1.1",        // Total
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6",    // Mono sin .0
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6.0",  // Mono con .0
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.7",    // Color sin .0
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.7.0",  // Color con .0
];

console.log(`📡 Escaneo exhaustivo de OIDs para ${ip}...`);
const session = snmp.createSession(ip, "public", { version: snmp.Version2c, timeout: 5000 });

session.get(oids, (error, varbinds) => {
  if (error) {
    console.error("❌ Error General:", error.message);
  } else {
    varbinds.forEach((vb, i) => {
      const status = snmp.isVarbindError(vb) ? `ERROR: ${snmp.varbindError(vb)}` : `VALOR: ${vb.value}`;
      console.log(`[${i}] ${oids[i]} -> ${status}`);
    });
  }
  session.close();
});
