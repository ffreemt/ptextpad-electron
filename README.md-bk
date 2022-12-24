# ptextpad-el

[![electron-forge](https://img.shields.io/badge/electron-forge-green.svg)](https://github.com/electron/forge) [![DeepScan grade](https://deepscan.io/api/teams/19673/projects/23138/branches/692217/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=19673&pid=23138&bid=692217) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A parallel text editor using electron

Coming soon...

## Firewall warning

`ptextpad-el` uses default port 5555 for inter-process communications between python (ezbee) and nodejs. `dezmq` (python) opens port 5555 in `zmq.REP` mode that provides alignment result from ezbee (maybe later on `dzbee` and `debee` as well). nodejs sends texts ro `dezmq`.

Hence, the first time you run `ptextpad-el`, you'll be asked to permit the opening of that port.  

## Debug

To turn on debug
* `nodejs`: set/export TRACER_DEBUG=debug
* `python`: set/export LOGLEVEL=10
