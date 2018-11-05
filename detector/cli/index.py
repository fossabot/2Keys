#!/usr/bin/env python3
# CLI for 2Keys
# I'm just making my own since that's easier for me to understand
import click
import sys
from watcher import Keyboard
from util import Logger, load_config

logger = Logger("cli")

@click.group()
def cli():
  return

@cli.command()
def init():
    click.echo('INIT')

@cli.command()
def sync():
    click.echo('Syncing')

@cli.command()
def add():
    click.echo('ADD')

@cli.command()
@click.argument("keyboard")
def watch(keyboard):
  if keyboard == "":
    logger.err("Please provide a keyboard to watch.")
    exit()
  
  # Keyboard specified, watch it
  config = load_config()
  keyboard = Keyboard(config["keyboards"][keyboard], keyboard)
  keyboard.watch_keyboard()

if __name__ == '__main__':
    cli()