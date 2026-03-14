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
const downloadPath = tempArchive + '.download';
const finalBinName = platform === 'win32' ? 'shenvy.exe' : 'shenvy';
const finalBinPath = path.join(binDir, platform === 'win32' ? 'shenvy.exe' : 'shenvy-bin');

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
        file.close(() => resolve());
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

const wait = (ms) => new Promise(r => setTimeout(r, ms));

async function ensureFileReady(filePath) {
  for (let i = 0; i < 10; i++) {
    try {
      // Try to open file for appending to check if it's locked
      const fd = fs.openSync(filePath, 'r+');
      fs.closeSync(fd);
      return true;
    } catch (e) {
      await wait(500);
    }
  }
  return false;
}

async function extractWithRetry(archivePath, destDir, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Extracting archive (attempt ${i + 1}/${retries})...`);
      if (platform === 'win32') {
        // Try PowerShell Expand-Archive
        const psCommand = `powershell.exe -NoProfile -Command "Expand-Archive -Path '${archivePath.replace(/'/g, "''")}' -DestinationPath '${destDir.replace(/'/g, "''")}' -Force"`;
        execSync(psCommand, { stdio: 'inherit' });
      } else {
        execSync(`tar -xzf "${archivePath}" -C "${destDir}"`, { stdio: 'inherit' });
      }
      return;
    } catch (e) {
      if (i === retries - 1) throw e;
      console.log(`Extraction failed or file locked, retrying in 1.5s...`);
      await wait(1500);
    }
  }
}

async function install() {
  try {
    console.log(`Downloading ${PROJECT_NAME} v${VERSION} for ${target}...`);
    if (fs.existsSync(downloadPath)) fs.unlinkSync(downloadPath);
    if (fs.existsSync(tempArchive)) fs.unlinkSync(tempArchive);
    
    await download(url, downloadPath);
    
    // Atomic rename to help OS release locks
    fs.renameSync(downloadPath, tempArchive);
    
    console.log('Verifying file access...');
    const isReady = await ensureFileReady(tempArchive);
    if (!isReady) console.warn('Warning: File might still be locked, proceeding anyway...');

    await extractWithRetry(tempArchive, binDir);
    
    const extractedBinPath = path.join(binDir, finalBinName);
    if (fs.existsSync(extractedBinPath)) {
        if (platform !== 'win32' && extractedBinPath !== finalBinPath) {
          if (fs.existsSync(finalBinPath)) fs.unlinkSync(finalBinPath);
          fs.renameSync(extractedBinPath, finalBinPath);
        }
    } else {
      throw new Error(`Extracted binary ${finalBinName} not found in ${binDir}`);
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
