#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');

const PROJECT_NAME = 'shenvy';
const REPO = 'Shenvy/shenvy-cli-dist';
const VERSION = require('../package.json').version;

const platform = os.platform();
const arch = os.arch();

const platformMap = {
  'win32-x64': 'windows_amd64.zip',
  'darwin-x64': 'darwin_amd64.tar.gz',
  'darwin-arm64': 'darwin_arm64.tar.gz',
  'linux-x64': 'linux_amd64.tar.gz',
  'linux-arm64': 'linux_arm64.tar.gz'
};

const target = `${platform}-${arch}`;
const archiveName = platformMap[target];

if (!archiveName) {
  console.error(`Error: Unsupported platform/architecture: ${target}`);
  process.exit(1);
}

const url = `https://github.com/${REPO}/releases/download/v${VERSION}/${PROJECT_NAME}_${archiveName}`;
const binDir = path.join(__dirname);
const binPath = path.join(binDir, platform === 'win32' ? 'shenvy.exe' : 'shenvy-bin');

console.log(`Downloading ${PROJECT_NAME} for ${target} from ${url}...`);

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return download(response.headers.location, dest).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

// Note: In a real production environment, we would use a library like 'tar' or 'adm-zip'
// but to keep dependencies zero, we would ideally bundle them or use child_process for unzip/tar.
// For this template, we assume the binary is directly downloadable or handled by a small helper.
download(url, binPath)
  .then(() => {
    if (platform !== 'win32') {
      fs.chmodSync(binPath, 0o755);
    }
    console.log(`${PROJECT_NAME} installed successfully.`);
  })
  .catch((err) => {
    console.error(`Error installing ${PROJECT_NAME}:`, err.message);
    process.exit(1);
  });
