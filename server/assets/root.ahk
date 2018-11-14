; File generated by 2Keys, template in assets/root.ahk
; 2Keys AutoHotkey entry point
; Currently inlin TS, as template not yet necessary

; Default AHK stuff
;#SingleInstance, force ; Uncomment this line if using AutoHotkey < v2
SetWorkingDir A_ScriptDir  ; Ensures a consistent starting directory.
;#Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.

; CONVERSION NOTICE 1
; All your hotkeys need to changed to functions
; Then, include the function to run in your config under the key mapping.
; The script with the function in should then be included below.
; See https://github.com/Gum-Joe/2Keys for help

; CONVERSION NOTICE 2
; Since the keyboards are plugged into a separte computer (the detector)
; You can't get keyboard states (and info. about the keyboards) using AutoHotkeys
; Soon we'll be adding a set of core libraries which will allow you to do, i.e.:
; #Include <2Keys/keyboards>
; keyboards.getState(keyboard, key)
; Syntax is subject to change

; CONVERSION NOTICE 3
; Depending on the version of AutoHotkey 2Keys is using
; You may need to migrate your scripts to AutoHotkey v2

; Include all your AutoHotkey scripts here
; i.e. #Include "run-apps.ahk"