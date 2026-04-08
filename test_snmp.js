const snmp = require("net-snmp");

const ip = "172.16.111.2";
const oids = [
  "1.3.6.1.2.1.43.10.2.1.4.1.1",     // Total Pages
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.6", // Mono
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.2.7", // Color
  "1.3.6.1.2.1.43.11.1.1.9.1.1",        // Cyan
  "1.3.6.1.2.1.43.11.1.1.9.1.2",        // Magenta
  "1.3.6.1.2.1.43.11.1.1.9.1.3",        // Yellow
  "1.3.6.1.2.1.43.11.1.1.9.1.4",        // Black
];

console.log(`📡 Probando SNMP hacia ${ip} (v2c)...`);
// Usar v2c suele ser mejor para manejar errores parciales en algunos agentes
const session = snmp.createSession(ip, "public", { version: snmp.Version2c, timeout: 5000 });

session.get(oids, (error, varbinds) => {
  if (error) {
    console.error("❌ Error General SNMP:", error.message);
  } else {
    for (let i = 0; i < varbinds.length; i++) {
        if (snmp.isVarbindError(varbinds[i])) {
            console.log(`[-] OID ${oids[i]} -> ERROR: ${snmp.varbindError(varbinds[i])}`);
        } else {
            console.log(`[+] OID ${oids[i]} -> VALOR: ${varbinds[i].value}`);
        }
    }
  }
  session.close();
});
