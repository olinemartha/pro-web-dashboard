@echo off
title StageManager - hors ligne
cd /d "%~dp0"
echo.
echo  StageManager - version hors ligne (sans internet)
echo  Les donnees restent sur cet ordinateur.
echo.
echo  Le navigateur va s'ouvrir sur http://localhost:5180
echo  Gardez cette fenetre ouverte pendant l'utilisation.
echo.
call npm.cmd run hors-ligne
pause
