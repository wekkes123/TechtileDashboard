@echo off
title MQTT Simulation Runner
cd /d %~dp0

echo Starting mock_pis.js...
start "Mock Pis" cmd /k node mock_pis.js

echo Both scripts are running in separate windows.
exit
