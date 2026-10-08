type MotionOptions = { kind?: 'language' | 'theme' | 'page'; selector?: string; isCurrent?: () => boolean };
let queue: Promise<void> = Promise.resolve();
const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
/** Cover outgoing content before committing changes; reveal only the new content. */
export function transition(update: () => void | Promise<void>, options: MotionOptions = {}) {
 const run = async () => {
  if (options.isCurrent && !options.isCurrent()) return;
  const fullScreen = options.kind === 'language' || options.kind === 'theme';
  const target = document.querySelector<HTMLElement>(fullScreen ? '.app-shell,.auth-shell' : options.selector || '#main');
  if (!target || matchMedia('(prefers-reduced-motion: reduce)').matches || !target.animate) { await update(); return; }
  const root = document.documentElement;
  const style = getComputedStyle(root);
  const duration = (name: string, fallback: number) => {
   const value = style.getPropertyValue(name).trim();
   return value ? parseFloat(value) * (value.endsWith('ms') ? 1 : 1000) : fallback;
  };
  const rect = target.getBoundingClientRect();
  const footer = document.querySelector('.footer')?.getBoundingClientRect();
  const veil = document.createElement('div');
  veil.className = fullScreen ? 'motion-veil full-screen' : 'motion-veil'; veil.setAttribute('aria-hidden', 'true');
  const bottom = options.selector === '.lesson-content' ? Math.max(0, innerHeight - rect.bottom) : Math.max(0, innerHeight - (footer?.top ?? innerHeight));
  Object.assign(veil.style, { top: `${fullScreen ? 0 : Math.max(0, rect.top)}px`, bottom: `${fullScreen ? 0 : bottom}px`, left: `${fullScreen ? 0 : Math.max(0, rect.left)}px`, right: `${fullScreen ? 0 : Math.max(0, innerWidth - rect.right)}px`, backgroundColor: style.backgroundColor });
  veil.dataset.effect = options.kind === 'theme' ? 'radial' : options.kind === 'language' ? 'sweep' : 'fade';
  const themeButton = document.querySelector('.theme-button')?.getBoundingClientRect();
  const cx = themeButton ? themeButton.left + themeButton.width / 2 : innerWidth / 2;
  const cy = themeButton ? themeButton.top + themeButton.height / 2 : innerHeight / 2;
  const radius = Math.ceil(Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)));
  const circle = (size: number) => `circle(${size}px at ${cx}px ${cy}px)`;
  const outgoing: Keyframe[] = options.kind === 'theme'
   ? [{opacity:1,clipPath:circle(0)},{opacity:1,clipPath:circle(radius)}]
   : options.kind === 'language'
    ? [{opacity:1,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0% 0 0)'}]
    : [{opacity:0},{opacity:1}];
  const incoming: Keyframe[] = options.kind === 'theme'
   ? [{opacity:1,clipPath:circle(radius)},{opacity:1,clipPath:circle(0)}]
   : options.kind === 'language'
    ? [{opacity:1,clipPath:'inset(0 0 0 0%)'},{opacity:1,clipPath:'inset(0 0 0 100%)'}]
    : [{opacity:1},{opacity:0}];
  const focused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const wasInert = target.inert; target.inert = true;
  root.dataset.motionKind = options.kind || 'page'; root.dataset.motionPhase = 'out';
  document.body.append(veil);
  let animation: Animation | undefined;
  try {
   animation = veil.animate(outgoing, { duration: duration('--motion-exit', 260), easing: 'ease-in-out', fill: 'forwards' });
   await animation.finished;
   root.dataset.motionPhase = 'covered';
   if (!options.isCurrent || options.isCurrent()) await update();
   // Settle React effects and language resources while completely covered.
   await frame(); await frame();
   const nextColor = getComputedStyle(root).backgroundColor;
   if (options.kind === 'theme') {
    const color = veil.animate([{ backgroundColor: veil.style.backgroundColor }, { backgroundColor: nextColor }], { duration: 140, fill: 'forwards' });
    await color.finished; veil.style.backgroundColor = nextColor; color.cancel();
   } else { veil.style.backgroundColor = nextColor; await pause(duration('--motion-cover', 120)); }
   root.dataset.motionPhase = 'in';
   animation.cancel();
   animation = veil.animate(incoming, { duration: duration('--motion-enter', 420), easing: 'ease-in-out', fill: 'forwards' });
   await animation.finished;
  } finally {
   animation?.cancel(); veil.remove(); target.inert = wasInert;
   delete root.dataset.motionPhase; delete root.dataset.motionKind;
   if (options.kind === 'page') document.getElementById('main')?.focus({ preventScroll: true });
   else if (focused?.isConnected) focused.focus({ preventScroll: true });
  }
 };
 const task = queue.then(run); queue = task.catch(() => {}); return task;
}
