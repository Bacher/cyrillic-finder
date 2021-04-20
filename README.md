# Cyrillic chars finder

## Usage:

```sh
$ cyrillic-finder
$ cyrillic-finder '**/*.ts'
$ cyrillic-finder -i '**/messages.ts' '**/*.ts'
```

```
Options:
  -h, --help          Show help                                        [boolean]
  -v, --version       Show version number                              [boolean]
  -p, --path          Run in specific directory     [default: current directory]
  -i, --ignore        Ignore pattern in glob syntax (ex: cache/**)      [string]
      --no-gitignore  Don't use .gitignore for ignoring                [boolean]
      --error         Exit with error code when chars had found        [boolean]
      --no-color      Do not colorize output                           [boolean]
      --no-filename   Do not output the filenames                      [boolean]
      --no-content    Do not output the content of line                [boolean]

Examples:
  cyrillic-finder '**/*.ts'                     Run for .ts files
  cyrillic-finder -p src/                       Use for files in src directory
  cyrillic-finder --ignore '.cache/**' -p src/  Use ignoring pattern
  cyrillic-finder                               Run in current working directory
```
