#!/usr/bin/env bash
set -e

trap 'kill 0' INT TERM

npm run dev:server &
npm run dev:client &

wait
