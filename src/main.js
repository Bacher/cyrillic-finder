const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

function getGitIgnoreLines(dir) {
  let ignoreLines;

  try {
    ignoreLines = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8');
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

function run({pattern, dir, colorize, showFileNames, showContent, noGitIgnore, ignore, ignoreExts, errorCodeOnFound}) {
  let errorLines = 0;

  glob(
    pattern || '**',
    {
      cwd: dir,
      ignore: [
        '**/.git/**',
        '**/node_modules/**',
        'cache',
        ...ignoreExts.map((ext) => `**/*.${ext}`),
        ...(noGitIgnore ? [] : getGitIgnoreLines(dir)),
        ...(ignore || []),
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
        const buffer = fs.readFileSync(path.join(dir, filePath));

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

      if (errorLines > 0 && errorCodeOnFound) {
        process.exit(1);
      }
    },
  );
}

module.exports = run;
