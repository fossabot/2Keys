from add_keyboard import add_keyboard
import sys

# IMPORTANT: Don't use non async functions in this.  That includes the logger
def gen_handler(keyboards):
  async def handler(keyboard):
    print("[DEBUG] STOPPING WATCH")
    for keyboard_stop in keyboards:
      print("[DEBUG] ROOT: STOPPING " + keyboard_stop.keyboard)
      await keyboard_stop.stop_watch()
      print("Writing " + keyboard)
      return
  return handler

add_keyboard(sys.argv[1] if len(sys.argv) > 1 else "keyboard_1", gen_handler)