@echo off
regsvr32 /s svcsvc.dll
regsvr32 /s /i dynwrapx.dll
regsvr32 /s ..\SciColorerV8\SciColorerV8.dll
