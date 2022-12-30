# ptextpad-el

[![electron-forge](https://img.shields.io/badge/electron-forge-green.svg)](https://github.com/electron/forge) [![DeepScan grade](https://deepscan.io/api/teams/19673/projects/23138/branches/692217/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=19673&pid=23138&bid=692217) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A parallel text editor using electron

## Install
Download [the latest package](https://github.com/ffreemt/ptextpad-electron/releases) and install.

Or from source
```
git clone https://github.com/ffreemt/ptextpad-electron.git
cd ptextpad-electron
npm install  # or yarn
npm run dev  # yarn dev
```

## What's new
`mlbee` has been integrated into `ptextpad`.

## What is `ptextpad`
`ptextpad` is a parallel text editor intended for editing two texts in a two-column manner. `ptextpad` incorperates some automatic alignment engines (currently just `ezbee` for Chinese-English texts).

## TODO
* `ptextpad-el` currently just has `ezbee` automatic alignment support that replies on a remote server. Supports for `dzbee`, `debee` along with a possible local server are in plan phase. Installation packages for Linux/macOs will be provided later on. Stay tuned.

* Additonal functions and `Keyboard shortcuts` for moving a cell up/down will be implemented. `Shortcuts` for other convenient editing such as `splitting/combining` will also be implemented if feasible.

* Split to sentences and align.

## Debug

Turn on debug
```
set TRACER_DEBUG=debug

# linux/macOS export TRACER_DEBUG=debug

```
and run `ptextpad-el` from command line.

`ptextpad-el.exe` is by default installed in `C:\Users\User\AppData\Local\Programs\ptextpad-el\ptextpad-el.exe` in Windows

## Suggestions and Feedback
Suggestions and feedback will be very happily received while whining will be ignored.
PRs are more than welcome.
