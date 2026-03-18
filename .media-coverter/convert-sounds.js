/**
 * Batch convert soundboard files to Ogg Opus format.
 *
 * Usage:
 *   node convert-sounds.js <input-dir> [output-dir]
 *
 * If output-dir is omitted, converted files are written to <input-dir>/opus/
 *
 * You will be prompted for a volume level (0-100) before conversion starts.
 * 100 = original volume, 50 = half volume, 200 = double volume, etc.
 *
 * Run `npm install` in this folder first to get ffmpeg-static.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ffmpeg = require('ffmpeg-static');

const inputDir = process.argv[2];
const outputDir = process.argv[3] || (inputDir ? path.join(inputDir, 'opus') : null);

if (!inputDir) {
  console.error('Usage: node convert-sounds.js <input-dir> [output-dir]');
  process.exit(1);
}

if (!fs.existsSync(inputDir)) {
  console.error(`Input directory not found: ${inputDir}`);
  process.exit(1);
}

const audioExtensions = ['.ogg', '.mp3', '.wav', '.m4a', '.flac', '.aac', '.wma'];
const files = fs.readdirSync(inputDir).filter(f => {
  const ext = path.extname(f).toLowerCase();
  return audioExtensions.includes(ext);
});

if (files.length === 0) {
  console.error('No audio files found in input directory.');
  process.exit(1);
}

function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(query, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  console.log(`Found ${files.length} audio file(s) to convert.\n`);

  const volumeInput = await askQuestion('Enter volume level (0-100, default 100): ');
  const volumePercent = volumeInput === '' ? 100 : parseInt(volumeInput, 10);

  if (isNaN(volumePercent) || volumePercent < 0) {
    console.error('Invalid volume. Please enter a number between 0 and 100.');
    process.exit(1);
  }

  const volumeFilter = (volumePercent / 100).toFixed(2);
  console.log(`\nVolume: ${volumePercent}% (filter: ${volumeFilter})\n`);

  fs.mkdirSync(outputDir, { recursive: true });

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const inputPath = path.join(inputDir, file);
    const outputName = path.parse(file).name + '.ogg';
    const outputPath = path.join(outputDir, outputName);

    process.stdout.write(`Converting: ${file} -> ${outputName} ... `);

    try {
      const args = [
        '-i', inputPath,
        '-af', `volume=${volumeFilter}`,
        '-c:a', 'libopus',
        '-b:a', '96k',
        '-vn',
        '-y',
        outputPath
      ];

      execFileSync(ffmpeg, args, { stdio: 'pipe' });

      console.log('OK');
      success++;
    } catch (err) {
      console.log('FAILED');
      console.error(`  Error: ${err.stderr?.toString().split('\n').pop()}`);
      failed++;
    }
  }

  console.log(`\nDone! ${success} converted, ${failed} failed.`);
  console.log(`Output: ${outputDir}`);
}

main();
