// node:child_process – a web page can't open folders or start programs; the call quietly does nothing.
export function spawn() {
  const child = { on() { return child; }, once() { return child; }, unref() { return child; }, kill() {} };
  return child;
}
export default { spawn };
