export function Logo({ height = 28 }: { height?: number }) {
  // Plain <img>, not next/image: this is a small, non-LCP brand mark used
  // on every page, so the extra config (width/height or a static import)
  // next/image needs isn't worth it here.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/logo.png" alt="FutureReady Leadership" style={{ height, width: 'auto' }} />;
}
