const fs = require('fs');
const path = require('path');


// scripts/afterAllArtifactBuild.js
exports.default = async function afterAllArtifactBuild(context) {
    console.log('afterAllArtifactBuild.');

    const file = path.join(__dirname, '..', 'dist', 'latest-mac.yml');
    if (fs.existsSync(file)) {
        fs.rmSync(file);
        console.log('latest-mac.yml removed before publish.');
    } else {
        console.log('latest-mac.yml not found.');
    }
}