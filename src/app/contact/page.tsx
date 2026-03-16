export default function ContactPage() {
  return (
    <main className="min-h-screen pt-40 px-8 bg-white dark:bg-black text-black dark:text-white pb-24 flex flex-col justify-center">
      <div className="max-w-4xl">
        <h1 className="text-6xl md:text-9xl font-black tracking-tighter uppercase mb-8">
          Let's Talk.
        </h1>
        <a 
          href="mailto:hello@example.com" 
          className="text-3xl md:text-6xl font-bold tracking-tight text-zinc-500 hover:text-black dark:hover:text-white transition-colors"
        >
          hello@example.com
        </a>
      </div>
    </main>
  );
}
