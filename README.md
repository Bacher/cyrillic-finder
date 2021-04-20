# find-bad-symbols

## Usage:

```sh
$ find-bad-symbols
$ find-bad-symbols '**/*.ts'
$ find-bad-symbols -i '**/messages.ts' '**/*.ts'
```

```
Options:
  -h, --help          Show help                                        [boolean]
  -v, --version       Show version number                              [boolean]
  -p, --path          Run in specific directory     [default: current directory]
  -i, --ignore        Ignore pattern in glob syntax (ex: cache/**)      [string]
      --no-gitignore  Don't use .gitignore for ignoring                [boolean]
      --error         Exit with error code when characters had found   [boolean]
      --no-color      Do not colorize output                           [boolean]
      --no-filename   Do not output the filenames                      [boolean]
      --no-content    Do not output the content of line                [boolean]
      --cyrillic      Find only cyrillic characters                    [boolean]

Examples:
  find-bad-symbols '**/*.ts'             Run for .ts files
  find-bad-symbols -p src/               Use for files in src directory
  find-bad-symbols --ignore '.cache/**'  Use ignoring pattern
  find-bad-symbols                       Run in current working directory
```
