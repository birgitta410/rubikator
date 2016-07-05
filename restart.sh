#!/bin/bash

kill `pgrep -f "node server.js"`
rm rubikator.log
npm start > rubikator.log &
