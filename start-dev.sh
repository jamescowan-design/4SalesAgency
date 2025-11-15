#!/bin/bash
ulimit -n 65536
export NODE_ENV=development
cd /home/ubuntu/4SalesAgency
exec node --import tsx server/_core/index.ts
