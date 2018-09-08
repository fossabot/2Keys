import sys
import requests
import json
import os
import multiprocessing
import time
from os import path
import asyncio
import aiofiles
import yaml
import colorful
from constants import KEYBOARDS_PATH_BASE, KEYBOARD_EVENT_FORMAT, KEYBOARD_EVENT_SIZE, SCRIPTS_ROOT
from logger import Logger
from watch_keyboard import Keyboard as KeyboardWatcher

logger = Logger("oobe")

logger.info("Welcome to the OOBE for the detector!")
logger.info("First we need to know where to find the server")
logger.info("Enter the ipv4 address of the server below:")
#ipv4 = input("")
ipv4 = "192.168.0.4"
logger.info("Enter the port of the server below:")
#port = input("")
port = "9090"

# Make request, get config in JSON format
# TODO: Error handling
logger.info("Fetching config...")
try:
  config_json = requests.get("http://" + ipv4 + ":" + port + "/api/get/config")
except requests.exceptions.ConnectionError:
  logger.err("Couldn't estanblish a connection to the server.")
  logger.err("Please check your internet connection.")
  exit() # Can't do any more
if config_json.status_code >= 400: # i.e. 404 or 500
  logger.err("ERROR: Request for config unsucessful!")
  logger.err("Got status code " + str(config_json.status_code) + " with response:")
  logger.err(config_json.text)
  logger.debug("Headers: ")
  logger.debug(config_json.headers)
  exit()
config = json.loads(config_json.text)


# Save config
logger.info("Saving config to " + os.getcwd() + "...")
config_file = open("config.yml", "w")
config_file.write("# Config for 2Keys\n# ONLY FOR USE BY THE PROGRAM\n# To change the config, update it on the client and run \"2Keys config-update\" here\n" +
                  yaml.dump(config, default_flow_style=False))
config_file.flush() # Needed so that add keyboard can read it

# Then scan for keyboards
# Since running directly from here causes issues with async not stopping etc, holding everything up
# run 2Keys add
# (essentially run in another process)
# Do for each keyboard in config.keyboards
logger.info("Running scripts to add path for keyboard input...")
for key, value in config["keyboards"].items():
  logger.info("Running script to add keyboard for keyboard " + colorful.cyan(key) + "...")
  ADD_KEYBOARD_CLI = SCRIPTS_ROOT + "/add_keyboard-cli.py"
  os.system("cd " + os.getcwd() + " && python3 "+ ADD_KEYBOARD_CLI + " " + key)

logger.info("") # To make output look better
logger.info("Scanning for keyboards...")
if not path.isdir(KEYBOARDS_PATH_BASE): # Make sure there's something to detect
  logger.err("Couldn't scan for keyboards")
  logger.err("Verify you have at least one keyboard plugged in")
  logger.err("and the dir /dev/input/by-id exists")
  exit()
# Scan
# From https://stackoverflow.com/questions/3207219/how-do-i-list-all-files-of-a-directory
keyboards = os.listdir(KEYBOARDS_PATH_BASE)
logger.debug("Keyboards:")
logger.debug(keyboards)

logger.info("Press a button on the keyboard you want to map to register it.")
# Then watch all keyboards and ask for one to be pressed

# Add paths, sync changes to server
# Async helped by https://hackernoon.com/asynchronous-python-45df84b82434
# keyboards_events = [KeyboardWatcher(keyboard_path) for keyboard_path in keyboards]
# IMPORTANT: Don't use non async functions in this.  That includes the logger
'''
async def keyboard_watcher(keyboard):
  async with aiofiles.open(KEYBOARDS_PATH_BASE + "/" + keyboard, "rb") as in_file:
    event = await in_file.read(KEYBOARD_EVENT_SIZE)  # Open input file
    # Only triggers when key pressed
    while event:
      print("[ASYNC DEBUG] Key pressed on " + keyboard)
      await in_file.close()
      break; # Without break, this can be used for regular watching

#async for keyboard in keyboards_events:
'''

'''
async def keyboard_watcher(index_in_array):
  detect_keyboard = await keyboards_events[index_in_array].watch_keyboard()
  if detect_keyboard == "yes":
    # Kill others
    for keyboard in keyboards_events:
      keyboard.stop_watch()
    # Proceed
    logger.info("Path: " + keyboards_events[index_in_array].keyboard)
    return 1
  else:
    return 0



'''

async def handler():
  print("[DEBUG] STOPPING WATCH")
  for keyboard in keyboards_events:
    print("[DEBUG] ROOT: STOPPING " + keyboard.keyboard)
    await keyboard.stop_watch()
    return

#jobs = [keyboards_events[i].keyboard_watcher(handler) for i in range(0, len(keyboards))]
#loop = asyncio.get_event_loop()
#loop.run_until_complete(asyncio.wait(jobs))