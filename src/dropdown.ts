export function setupDropdown(menu: HTMLDetailsElement, selector: string, selected: (value: string) => void): void {
  const summary = menu.querySelector('summary')!;
  const choices = Array.from(menu.querySelectorAll<HTMLButtonElement>(selector));
  choices.forEach((button) =>
    button.addEventListener('click', () => {
      selected(button.dataset.language ?? button.dataset.themeChoice ?? button.dataset.anchorChoice ?? 'system');
      menu.open = false;
      summary.focus();
    }),
  );
  menu.addEventListener('toggle', () => {
    summary.setAttribute('aria-expanded', String(menu.open));
    if (menu.open)
      document.querySelectorAll<HTMLDetailsElement>('.language-menu').forEach((other) => {
        if (other !== menu) other.open = false;
      });
  });
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menu.open = false;
      summary.focus();
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      menu.open = true;
      const index = choices.indexOf(document.activeElement as HTMLButtonElement);
      const next =
        index < 0 ? (event.key === 'ArrowDown' ? 0 : choices.length - 1) : (index + (event.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length;
      choices[next]?.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
  });
}
