const fs = require('fs');
const path = require('path');
const os = require("os");



exports.default = async function (context) {
    const file = path.join(__dirname, '..', 'dist', 'latest-mac.yml');
    console.log('test...', file);
    if (fs.existsSync(file)) {
        fs.rmSync(file);
        console.log('latest-mac.yml removed before publish.');
    } else {
        console.log('latest-mac.yml not found.');
    }
}