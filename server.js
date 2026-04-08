const express = require('express');
const path = require('path');
const app = express();
const port = 8000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

const { router: printersRouter } = require('./Routes/printers');
const { router: inventoryRouter } = require('./Routes/inventory');

// API routes for printers data
app.use('/api/printers', printersRouter);
app.use('/api/inventory', inventoryRouter);

// Serve the React frontend on /printers
app.get('/printers', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((req, res) => {
    res.redirect('/printers');
});

app.listen(port, () => {
    console.log(`Servidor en ejecución en http://localhost:${port}/printers`);
});
