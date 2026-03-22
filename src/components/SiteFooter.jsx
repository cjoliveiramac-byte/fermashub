export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="pointer-events-none fixed bottom-3 left-0 right-0 z-30 flex justify-center px-4">
      <div className="rounded-full border border-zinc-200/70 bg-white/80 px-3 py-1 text-[11px] text-zinc-600 shadow-sm backdrop-blur dark:border-zinc-800/70 dark:bg-zinc-950/70 dark:text-zinc-300">
        © {year} FermasHub. Todos os direitos reservados ao criador do site,
        Ciro Oliveira.
      </div>
    </footer>
  );
}
