#!/usr/bin/env node

const yargs = require('yargs/yargs');
const {hideBin} = require('yargs/helpers');

const {argv} = yargs(hideBin(process.argv))
  .scriptName(require('./package.json').name)
  .option('path', {
    alias: 'p',
    description: 'Run in specific directory',
    default: process.cwd(),
    defaultDescription: 'current directory',
  })
  .option('ignore', {
    alias: 'i',
    description: 'Ignore pattern in glob syntax (ex: cache/**)',
    type: 'string',
  })
  .option('no-gitignore', {
    description: "Don't use .gitignore for ignoring",
    type: 'boolean',
  })
  .option('error', {
    description: 'Exit with error code when characters had found',
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
  .option('cyrillic', {
    description: 'Find only cyrillic characters',
    type: 'boolean',
  })
  .alias('help', 'h')
  .alias('version', 'v')
  .example([
    ["$0 '**/*.ts'", 'Run for .ts files'],
    ['$0 -p src/', 'Use for files in src directory'],
    ["$0 --ignore '.cache/**'", 'Use ignoring pattern'],
    ['$0', 'Run in current working directory'],
  ]);

const ignoreExts = ['jpg', 'jpeg', 'gif', 'png', 'zip', 'gz'];

const dir = argv.path;
const pattern = argv._[0];
const colorize = !('color' in argv) || argv.color === true;
const showFileNames = !('filename' in argv) || argv.filename === true;
const showContent = !('content' in argv) || argv.content === true;
const gitIgnore = !('gitignore' in argv) || argv.gitignore === true;
const errorCodeOnFound = Boolean(argv.error);
const onlyCyrillic = Boolean(argv.cyrillic);

function toArray(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  return [value];
}

require('./src/main')({
  dir,
  pattern,
  colorize,
  showFileNames,
  showContent,
  gitIgnore,
  ignore: toArray(argv.ignore),
  ignoreExts,
  errorCodeOnFound,
  onlyCyrillic,
});
