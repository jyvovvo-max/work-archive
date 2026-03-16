export default function Header() {
  return (
    <header className="fixed top-12 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-80px)] max-w-[1600px] border border-[#111111] bg-[#d5d5d5] grid grid-cols-1 md:grid-cols-2 text-[#111111] uppercase tracking-tighter font-black text-xs sm:text-sm">
      <div className="p-3 border-b md:border-b-0 md:border-r border-[#111111] flex flex-col md:flex-row md:items-center justify-between">
        <span>[01] VISUAL_ARCHIVE</span>
        <span className="opacity-50 mt-1 md:mt-0">J.Y. PORTFOLIO</span>
      </div>
      <nav className="flex divide-x divide-[#111111]">
        <button className="flex-1 p-3 hover:bg-[#111111] hover:text-[#d5d5d5] transition-colors text-center">GRID</button>
        <button className="flex-1 p-3 hover:bg-[#111111] hover:text-[#d5d5d5] transition-colors text-center hidden sm:block">LIST</button>
        <button className="flex-1 p-3 hover:bg-[#111111] hover:text-[#d5d5d5] transition-colors text-center hidden md:block">TIMELINE</button>
        <button className="flex-1 p-3 hover:bg-[#111111] hover:text-[#d5d5d5] transition-colors text-center">CATEGORY</button>
        <button className="flex-1 p-3 hover:bg-[#111111] hover:text-[#d5d5d5] transition-colors text-center">SHUFFLE</button>
      </nav>
    </header>
  );
}
