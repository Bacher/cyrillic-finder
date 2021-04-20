const fs = require('fs');
const path = require('path');
const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');
const glob = require('glob');
const chalk = require('chalk');

const {argv} = yargs(hideBin(process.argv))
  .option('ignore', {
    alias: 'i',
    description: 'Ignore pattern in glob syntax (ex: cache/**)',
    example: '.cache/**/*',
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
    ['$0 src/', 'Use for files in src directory'],
    ["$0 --ignore '.cache/**' src/", 'Use ignoring pattern'],
    ['$0', 'Run in current working directory'],
  ]);

console.log(argv);

const DIR = argv._[0] || process.cwd();

const colorize = !('color' in argv) || argv.color === true;
const showFileNames = !('filename' in argv) || argv.filename === true;
const showContent = !('content' in argv) || argv.content === true;

function toArray(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

let someFound = false;

glob(
  '!(node_modules|.next|build|*cache*|.git|.idea)/**',
  {
    cwd: DIR,
    ignore: ['**/*.png', '**/*.jpe?g', ...toArray(argv.ignore)],
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

    for (const filePath of files) {
      const content = fs.readFileSync(path.join(DIR, filePath), 'utf-8');

      const match = content.match(/[а-яёй]+/i);

      if (match) {
        someFound = true;

        console.log(`File "${filePath}" contains cyrillic chars${!showFileNames && !showContent ? '' : ':'}`);

        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const lineMatch = line.match(/[а-яёй]+(?:[\s,.:-?+]*[а-яёй]+)*/i);

          if (lineMatch) {
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
          }
        }
      }
    }

    if (someFound && argv.error) {
      process.exit(1);
    }
  },
);
