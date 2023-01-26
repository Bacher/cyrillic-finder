const fs = require('fs');
const path = require('path');
const glob = require('glob');
const chalk = require('chalk');

const BOUNDARY = 30;
const ERROR_LINES_LIMIT = 100;

const separationRegExp = '[\\s,.:?+-]';

const punctuationSymbols = '.…,:;!=\'"’`^~&*$€@?%#§\\-–—+|<>«»„“”(){}[\\]\\\\/';
const tableSymbols = '│┌─┐└┘┃┏━┓┗┛';
const otherSymbols = '↑↓←→©';

const allowedSymbols = [punctuationSymbols, tableSymbols, otherSymbols].join('');

const commonRegExp = `[^\\w\\s\\t${allowedSymbols}]`;

const cyrillicRegExp = '[а-яёй]';

const regGroups = {
  common: {
    find: new RegExp(`${commonRegExp}+`),
    group: new RegExp(`${commonRegExp}+(?:${separationRegExp}*${commonRegExp}+)*`),
  },
  cyrillic: {
    find: new RegExp(`${cyrillicRegExp}+`, 'i'),
    group: new RegExp(`${cyrillicRegExp}+(?:${separationRegExp}*${cyrillicRegExp}+)*`, 'i'),
  },
};

function getGitIgnoreLines(dir) {
  let ignoreLines;

  try {
    ignoreLines = fs.readFileSync(path.join(dir, '.gitignore'), 'utf-8');
  } catch (err) {
    console.log(err);
    return [];
  }

  const patterns = [];

  ignoreLines
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => Boolean(line) && !line.startsWith('#'))
    .forEach((line) => {
      let updated = line;

      if (updated.endsWith('/')) {
        updated += '**';
      } else {
        updated += '/**';
      }

      if (updated.startsWith('/')) {
        patterns.push(updated.substr(1, updated.length - 1));
      } else {
        patterns.push(updated, `**/${updated}`);
      }
    });

  return patterns;
}

function run({
  pattern,
  dir,
  colorize,
  showFileNames,
  showContent,
  gitIgnore,
  ignore,
  ignoreExts,
  errorCodeOnFound,
  onlyCyrillic,
}) {
  let errorLines = 0;

  const regGroup = onlyCyrillic ? regGroups.cyrillic : regGroups.common;

  glob(
    pattern || '**',
    {
      cwd: dir,
      ignore: [
        'node_modules/**',
        '**/node_modules/**',
        '*cache*/**',
        '**/*cache*/**',
        ...ignoreExts.map((ext) => `**/*.${ext}`),
        ...(gitIgnore ? getGitIgnoreLines(dir) : []),
        ...(ignore || []),
      ],
      nodir: true,
    },
    (err, files) => {
      if (err) {
        console.error(err);
        process.exit(1);
        return;
      }

      if (files.length > 20000) {
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

        const match = content.match(regGroup.find);

        if (match) {
          console.log(
            `File ${chalk.bold(`"${filePath}"`)} contains cyrillic chars${!showFileNames && !showContent ? '' : ':'}`,
          );

          const lines = content.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineMatch = line.match(regGroup.group);

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
                const start = Math.max(0, lineMatch.index - BOUNDARY);
                const len = Math.min(BOUNDARY, lineMatch.index);
                const start2 = lineMatch.index + lineMatch[0].length;

                const str = `${lineMatch.index > BOUNDARY ? '... ' : ''}${line.substr(start, len)}${value}${line.substr(
                  start2,
                  BOUNDARY,
                )}${start2 + BOUNDARY < line.length ? ' ...' : ''}`;

                output += `  ${str}`;
              }

              if (output.trim()) {
                console.log(output);
              }

              if (errorLines > ERROR_LINES_LIMIT) {
                break outer;
              }
            }
          }
        }

        if (errorLines > ERROR_LINES_LIMIT) {
          break;
        }
      }

      if (errorLines > ERROR_LINES_LIMIT) {
        console.log('... printed only first 100 lines (other skipped) ...');
      }

      if (errorLines > 0 && errorCodeOnFound) {
        process.exit(1);
      }
    },
  );
}

module.exports = run;
