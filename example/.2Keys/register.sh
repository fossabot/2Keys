#!/bin/bash
###
# Copyright 2018 Kishan Sambhi

# This file is part of 2Keys.

# 2Keys is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# 2Keys is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License
# along with 2Keys.  If not, see <https://www.gnu.org/licenses/>.

###
# File generated by 2Keys
# DO NOT MODIFY
# Please run using sudo
# 2Keys script to register and handler systemd services for 2Keys watchers

keyboards=(keyboard) # Please use format (keyboard keyboard keyboard)

# Functions
register() {
  echo Registering services...
  for keyboard in ${keyboards[@]};
  do
  echo "Adding script for ${keyboard}..."
  echo "Chmodding with 644..."
  chmod 644 ./.2Keys/2Keys-${keyboard}.service
  echo "Adding..."
  systemctl enable $PWD/.2Keys/2Keys-${keyboard}.service
  done
  echo Reloading daemon...
  systemctl daemon-reload
  start
}

disable() {
  echo Disabling services...
  stop
  for keyboard in ${keyboards[@]};
  do
  echo "Disabling script for ${keyboard}..."
  systemctl disable 2Keys-${keyboard}.service
  echo "To completely remove the scripts, remove the ./.2Keys dir."
  echo "Note that you will be unable to ever reuse the 2Keys services again once this is done"
  done
}

enable_scripts()  {
  echo Enabling services...
  for keyboard in ${keyboards[@]};
  do
  echo "Enabling script for ${keyboard}..."
  systemctl enable $PWD/.2Keys/2Keys-${keyboard}.service
  done
}


start() {
  echo Starting services...
  for keyboard in ${keyboards[@]};
  do
  echo "Starting script for ${keyboard}..."
  systemctl start 2Keys-${keyboard}.service
  done
}

stop() {
  echo Stopping services...
  for keyboard in ${keyboards[@]};
  do
  echo "Stopping script for ${keyboard}..."
  systemctl stop 2Keys-${keyboard}.service
  done
}

restart() {
  echo Restarting services...
  for keyboard in ${keyboards[@]};
  do
  echo "Restarting script for ${keyboard}..."
  systemctl restart 2Keys-${keyboard}.service
  done
}

status() {
  echo Getting statuses of services...
  for keyboard in ${keyboards[@]};
  do
  echo "Get status of ${keyboard}..."
  systemctl status 2Keys-${keyboard}.service
  echo ""
  done
}

# Root check
if [ "$EUID" -ne 0 ]
  then echo "Please run as root"
  exit 1
fi

# Parse arg
case $1 in
  register)
    register
    ;;
  disable)
    disable
    ;;
  enable)
    enable_scripts
    ;;
  start)
    start
    ;;
  stop)
    stop
    ;;
  restart)
    restart
    ;;
  status)
    status
    ;;
  help)
    echo Valid comands:
    echo "register: Registers and enables (starts on startup) services for use"
    echo "disable: Disbales services (stops them being started on startup)"
    echo "enable: Enables services (used after disabled has been run)"
    echo "start: Starts services"
    echo "stop: Stops services"
    echo "restart: Restarts services"
    echo "status: Gets statuses of all services"
    ;; 
  *)
    echo Invalid command.
    exit 1
    ;;
esac
