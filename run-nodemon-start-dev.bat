REM nodemon -e html,json,js -w . -x cross-env DEBUG=debug IS_DEV=true pn start 
REM nodemon -e bat,html,json,js -w . -x cross-env DEBUG=debug IS_DEV=true pn start 
nodemon -e bat,html,json,js,css -w src -x cross-env TRACER_DEBUG=debug LOGLEVEL=10 pn dev 
