export default function Footer() {
  return (
    <footer className="w-full px-8 py-12 flex flex-col md:flex-row items-center justify-between text-zinc-500 text-xs font-semibold uppercase tracking-widest border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <p>© {new Date().getFullYear()} PORTFOLIO. ALL RIGHTS RESERVED.</p>
      <div className="flex gap-6 mt-4 md:mt-0">
        <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Instagram</a>
        <a href="#" className="hover:text-black dark:hover:text-white transition-colors">LinkedIn</a>
        <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Behance</a>
      </div>
    </footer>
  );
}
