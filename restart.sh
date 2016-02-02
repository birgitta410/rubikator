#!/bin/bash

kill `pgrep -f "node server"`
rm server.log
node server > server.log &
