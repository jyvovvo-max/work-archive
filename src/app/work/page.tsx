export default function WorkPage() {
  return (
    <main className="min-h-screen pt-32 px-8 bg-white dark:bg-black text-black dark:text-white pb-24">
      <h1 className="text-7xl md:text-9xl font-black tracking-tighter uppercase mb-16">
        Selected<br/>Works
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Placeholder for works */}
        <div className="aspect-[4/3] bg-zinc-200 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
          <span className="font-bold text-zinc-400">Project 01</span>
        </div>
        <div className="aspect-[4/3] bg-zinc-200 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
          <span className="font-bold text-zinc-400">Project 02</span>
        </div>
        <div className="aspect-[4/3] bg-zinc-200 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
          <span className="font-bold text-zinc-400">Project 03</span>
        </div>
        <div className="aspect-[4/3] bg-zinc-200 dark:bg-zinc-900 rounded-lg flex items-center justify-center">
          <span className="font-bold text-zinc-400">Project 04</span>
        </div>
      </div>
    </main>
  );
}
