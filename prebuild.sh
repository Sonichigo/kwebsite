#!/bin/bash
# Replace these with your actual submodule repositories and paths
git clone https://github.com/keploy/demo-projects.git  --recurse-submodules ./components/atg/demo-projects
# Add more git clone commands for other submodules if needed
git submodule update
npm install