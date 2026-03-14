#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const os = require('os');
const { execSync } = require('child_process');

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

const url = `https://github.com/${REPO}/releases/download/v${VERSION}/shenvy_${archiveName}`;
const binDir = path.join(__dirname);
const tempArchive = path.join(binDir, archiveName);
const finalBinName = platform === 'win32' ? 'shenvy.exe' : 'shenvy';
const finalBinPath = path.join(binDir, platform === 'win32' ? 'shenvy.exe' : 'shenvy-bin');

console.log(`Downloading ${PROJECT_NAME} v${VERSION} for ${target} from ${url}...`);

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
      // Wait for 'close' instead of 'finish' to ensure OS handle is released
      file.on('close', resolve);
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function install() {
  try {
    if (fs.existsSync(tempArchive)) fs.unlinkSync(tempArchive);
    
    await download(url, tempArchive);
    
    // Small delay to let the OS settle
    await new Promise(r => setTimeout(r, 500));

    console.log('Extracting archive...');
    if (platform === 'win32') {
      const psCommand = `powershell.exe -NoProfile -Command "Expand-Archive -Path '${tempArchive.replace(/'/g, "''")}' -DestinationPath '${binDir.replace(/'/g, "''")}' -Force"`;
      execSync(psCommand);
    } else {
      execSync(`tar -xzf "${tempArchive}" -C "${binDir}"`);
    }
    
    const extractedBinPath = path.join(binDir, finalBinName);
    if (fs.existsSync(extractedBinPath)) {
        if (platform !== 'win32' && extractedBinPath !== finalBinPath) {
          if (fs.existsSync(finalBinPath)) fs.unlinkSync(finalBinPath);
          fs.renameSync(extractedBinPath, finalBinPath);
        }
    } else {
      throw new Error(`Extracted binary ${finalBinName} not found`);
    }

    if (fs.existsSync(tempArchive)) fs.unlinkSync(tempArchive);
    if (platform !== 'win32' && fs.existsSync(finalBinPath)) fs.chmodSync(finalBinPath, 0o755);
    
    console.log(`${PROJECT_NAME} v${VERSION} installed successfully.`);
  } catch (err) {
    console.error(`Error installing ${PROJECT_NAME}:`, err.message);
    process.exit(1);
  }
}

install();
