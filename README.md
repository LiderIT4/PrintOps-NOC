# PrintOps-NOC

## 🖨️ Printer Monitoring & Consumables Inventory Dashboard

Este proyecto implementa una plataforma de **monitoreo de impresoras y gestión de consumibles** orientada a entornos corporativos y de IT, combinando **scraping automatizado**, **inventario estructurado** y **visualización tipo dashboard**.

La solución permite centralizar información crítica como el estado de las impresoras, niveles de tinta y tóner, inventario disponible, criticidad por modelo y ubicación, y soporte para múltiples marcas y tecnologías (HP, Konica Minolta, Toshiba, entre otras).

### 🚀 Características principales

* Monitoreo automático de impresoras en red (ping + scraping web)
* Obtención de niveles de tinta/tóner por color (CMYK)
* Inventario detallado de consumibles (41+ ítems reales)
* Cache inteligente y persistencia en JSON
* Agrupación por modelo de impresora y referencia de consumible
* Indicadores de riesgo por stock mínimo
* Soporte para auto-login en impresoras con autenticación (ej. Konica)
* Escaneos programados vía cron
* Backend preparado para dashboards de IT y observabilidad
* Arquitectura extensible por scraper/modelo

### 🧱 Arquitectura

* **Backend:** Node.js + Express
* **Automatización:** Puppeteer
* **Persistencia:** JSON estructurado
* **Vista:** EJS (dashboard)
* **Scheduling:** node-cron
* **Red:** Ping ICMP para disponibilidad

### 📊 Casos de uso

* Prevención de quiebres de stock de consumibles
* Visibilidad centralizada de impresión corporativa
* Soporte IT proactivo
* Planeación de compras y reposición
* Auditoría de impresión por ubicación y modelo

### 🧠 Filosofía del proyecto

> “No solo saber si una impresora imprime hoy,  
> sino si podrá seguir imprimiendo mañana.”

El proyecto prioriza **datos accionables**, **automatización confiable** y una **experiencia de dashboard profesional**, alineada con prácticas de IT moderno.
