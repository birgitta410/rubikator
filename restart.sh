#!/bin/bash

kill `pgrep -f "node rubikator"`
rm rubikator.log
node rubikator > rubikator.log &
