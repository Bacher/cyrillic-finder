const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const glob = require('glob');
const chalk = require('chalk');

const {argv} = yargs(hideBin(process.argv))
  .option('path', {
    alias: 'p',
    description: 'Run in specific directory',
    default: process.cwd(),
    defaultDescription: 'current directory',
  })
  .option('ignore', {
    alias: 'i',
    description: 'Ignore pattern in glob syntax (ex: cache/**)',
    exaple: '.cache/**/*',
    type: 'string',
  })
  .option('error', {
    description: 'Exit with error code when chars had found',
    type: 'boolean',
  })
  .option('no-color', {
    description: 'Do not colorize output',
    type: 'boolean',
  })
  .option('no-filename', {
    description: 'Do not output the filenames',
    type: 'boolean',
  })
  .option('no-content', {
    description: 'Do not output the content of line',
    type: 'boolean',
  })
  .alias('help', 'h')
  .alias('version', 'v')
  .example([
    ["$0 '**.ts'", 'Run for .ts files'],
    ['$0 -p src/', 'Use for files in src directory'],
    ["$0 --ignore '.cache/**' -p src/", 'Use ignoring pattern'],
    ['$0', 'Run in current working directory'],
  ]);

const ignoreExts = ['jpg', 'jpeg', 'gif', 'png', 'zip', 'gz'];

const DIR = argv.path;

const colorize = !('color' in argv) || argv.color === true;
const showFileNames = !('filename' in argv) || argv.filename === true;
const showContent = !('content' in argv) || argv.content === true;

function getGitIgnoreLines() {
  let ignoreLines;

  try {
    ignoreLines = fs.readFileSync('.gitignore', 'utf-8');
  } catch (err) {
    console.log(err);
    return [];
  }

  return ignoreLines
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => Boolean(line))
    .map((line) => {
      let updated = line;

      if (!updated.startsWith('/')) {
        return `**/${updated}`;
      }

      if (updated.endsWith('/')) {
        updated += '**';
      } else {
        updated += '/**';
      }

      return updated;
    });
}

function toArray(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

function run() {
  let errorLines = 0;

  glob(
    argv._[0] || '**',
    {
      cwd: DIR,
      ignore: [
        '**/.git/**',
        '**/node_modules/**',
        'cache',
        ...ignoreExts.map((ext) => `**/*.${ext}`),
        ...getGitIgnoreLines(),
        ...toArray(argv.ignore),
      ],
      dot: true,
      nodir: true,
    },
    (err, files) => {
      if (err) {
        console.error(err);
        process.exit(1);
        return;
      }

      if (files.length > 5000) {
        console.error(`Too many files found: ${files.length}`);
        process.exit(1);
        return;
      }

      outer: for (const filePath of files) {
        const buffer = fs.readFileSync(path.join(DIR, filePath));

        for (let i = 0; i < buffer.length; i++) {
          if (buffer[i] === 0) {
            continue outer;
          }
        }

        const content = buffer.toString();

        const match = content.match(/[а-яёй]+/i);

        if (match) {
          console.log(`File "${filePath}" contains cyrillic chars${!showFileNames && !showContent ? '' : ':'}`);

          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineMatch = line.match(/[а-яёй]+(?:[\s,.:?+-]*[а-яёй]+)*/i);

            if (lineMatch) {
              errorLines++;

              let value = lineMatch[0];

              if (colorize) {
                value = chalk.bgRed(value);
              }

              let output = '  ';

              if (showFileNames) {
                output += `- ${filePath}:${i + 1}:${lineMatch.index + 1}`;
              }

              if (showContent) {
                const str = `${line.substr(0, lineMatch.index)}${value}${line.substr(
                  lineMatch.index + lineMatch[0].length,
                )}`;

                output += ` ${str}`;
              }

              if (output.trim()) {
                console.log(output);
              }

              if (errorLines > 100) {
                break;
              }
            }
          }
        }

        if (errorLines > 100) {
          break;
        }
      }

      if (errorLines > 0 && argv.error) {
        process.exit(1);
      }
    },
  );
}

module.exports = run;
