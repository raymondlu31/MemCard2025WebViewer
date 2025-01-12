/*
MemCard2025
MIT License
Copyright (c) 2025 Raymond Lou Independent Developer
See LICENSE file for full license information.
*/


// server/server.js 

const os = require('os');
const express = require('express');
const { initializeRuntime } = require('./initial_runtime');


const path = require('path');

const app = express();

// Serve static files from the 'htmlmemcard' directory
app.use(express.static(path.join(__dirname, '../htmlmemcard')));

// Default route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../htmlmemcard/indexmemcard.html'));
});

// Start server
const PORT = 54321;

// Initialize runtime when the server starts
initializeRuntime();

app.listen(PORT, () => {
    const networkInterfaces = os.networkInterfaces();
    const localIPs = Object.values(networkInterfaces)
        .flat()
        .filter((iface) => iface.family === 'IPv4' && !iface.internal)
        .map((iface) => iface.address);

    const ipAddress = localIPs.length > 0 ? localIPs[0] : 'localhost';

    console.log(`MemCardWebViewer is running at:`);
    console.log(`http://${ipAddress}:${PORT}`);
});