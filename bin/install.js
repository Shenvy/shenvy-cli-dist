#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const { execSync } = require('child_process');

const PROJECT_NAME = 'shenvy';
const REPO = 'Shenvy/shenvy-cli-dist';
// For the binary download, we still point to v0.1.0 since that's the latest CLI release
// even if the NPM wrapper version bumps to 0.1.1
const BINARY_VERSION = '0.1.0'; 

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

const url = `https://github.com/${REPO}/releases/download/v${BINARY_VERSION}/${PROJECT_NAME}_${archiveName}`;
const binDir = path.join(__dirname);
const tempArchive = path.join(binDir, archiveName);
const finalBinName = platform === 'win32' ? 'shenvy.exe' : 'shenvy';
const finalBinPath = path.join(binDir, platform === 'win32' ? 'shenvy.exe' : 'shenvy-bin');

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

download(url, tempArchive)
  .then(() => {
    console.log('Extracting archive...');
    // Use native tar (available in Win10+, macOS, Linux) to extract
    execSync(`tar -xf "${tempArchive}" -C "${binDir}"`);
    
    // Rename the extracted binary to the expected name if needed
    const extractedBinPath = path.join(binDir, finalBinName);
    if (extractedBinPath !== finalBinPath) {
      fs.renameSync(extractedBinPath, finalBinPath);
    }

    // Clean up the archive
    fs.unlinkSync(tempArchive);

    if (platform !== 'win32') {
      fs.chmodSync(finalBinPath, 0o755);
    }
    console.log(`${PROJECT_NAME} installed successfully.`);
  })
  .catch((err) => {
    console.error(`Error installing ${PROJECT_NAME}:`, err.message);
    process.exit(1);
  });
