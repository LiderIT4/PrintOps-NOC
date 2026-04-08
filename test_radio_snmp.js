const snmp = require("net-snmp");

const ip = "172.16.117.127";
const oids = [
  "1.3.6.1.2.1.43.10.2.1.4.1.1",               // Total Pages
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.10.1.1.25.1", // Black Cartridges Used
  "1.3.6.1.4.1.11.2.3.9.4.2.1.4.1.10.1.1.25.2", // Color Cartridges Used
];

console.log(`📡 Probando SNMP hacia ${ip} (Radio - HP 4720)...`);
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
