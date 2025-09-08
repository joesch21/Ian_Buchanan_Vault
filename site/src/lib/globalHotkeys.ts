function isTypingTarget(el: EventTarget | null) {
  return el instanceof HTMLElement && !!el.closest('input, textarea, [contenteditable="true"]');
}

window.addEventListener("keydown", (e) => {
  if (isTypingTarget(e.target)) return; // ignore shortcuts while typing
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    console.log('global shortcut: cmd/ctrl+k');
  }
  if (e.key === '/') {
    e.preventDefault();
    console.log('global shortcut: /');
  }
});

export {}; // ensure this file is treated as a module
