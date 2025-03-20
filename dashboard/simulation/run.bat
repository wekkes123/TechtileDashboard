@echo off
title MQTT Simulation Runner
cd /d %~dp0

echo Starting mock_pis.js...
start "Mocks running" cmd /k node index.js

echo Starting mqtt_listener.js...
start "MQTT Listener" cmd /k node mqtt_listener.js

echo Both scripts are running in separate windows.
exit
