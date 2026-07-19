import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white rounded-none flex items-center justify-center shadow-lg shadow-black/50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="black"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="20" height="15" x="2" y="3" rx="2" />
              <polyline points="8 21 12 17 16 21" />
            </svg>
          </div>
          <div>
            <span className="font-display font-black text-xl tracking-tight text-white uppercase">
              InstantShare
            </span>
            <span className="text-[9px] block text-neutral-400 font-mono tracking-[0.2em] uppercase">
              P2P WEB RTC
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          Sign-up Free &bull; Direct Connection
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl w-full mx-auto px-6 py-12 md:py-20 flex-grow flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block text-xs uppercase tracking-[0.2em] font-mono font-semibold text-neutral-300 mb-3 bg-white/5 px-3.5 py-1 rounded-none border border-white/10">
            Zero Installations &bull; Full Privacy
          </span>
          <h1 className="text-4xl md:text-6xl font-display font-extrabold tracking-tight text-white mt-1 mb-6 leading-none">
            Share Your Screen <br />
            <span className="text-white underline decoration-white/20 underline-offset-8">
              Instantly with Anyone
            </span>
          </h1>
          <p className="text-gray-400 text-lg font-light leading-relaxed">
            Create a secure peer-to-peer screen sharing room in one click.
            Share the generated link with your audience. No accounts, no ads,
            and completely free.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto w-full">
          <Link
            href="/chat"
            className="bg-white hover:bg-neutral-200 text-black font-bold py-4 px-8 rounded-none text-sm uppercase tracking-wider text-center transition-all shadow-lg"
          >
            Start Screen Share
          </Link>
          <Link
            href="/chat"
            className="bg-neutral-900 border border-white/20 hover:border-white hover:bg-neutral-800 text-white font-medium py-4 px-8 rounded-none text-sm uppercase tracking-wider text-center transition-all"
          >
            Join a Room
          </Link>
        </div>

        {/* How it works */}
        <div className="max-w-4xl mx-auto w-full mt-16 p-6 rounded-none bg-white/[0.01] border border-white/10">
          <h3 className="text-sm font-semibold text-white mb-4">
            How does it work?
          </h3>
          <div className="grid sm:grid-cols-3 gap-6 text-xs text-gray-400">
            <div>
              <span className="font-semibold text-white block mb-1">
                1. Click Share
              </span>
              Configure your preferences and start sharing. Our signaling
              server creates a direct P2P link.
            </div>
            <div>
              <span className="font-semibold text-white block mb-1">
                2. Send Link
              </span>
              Copy and share the room URL. Viewers connect securely over
              WebRTC directly to you.
            </div>
            <div>
              <span className="font-semibold text-white block mb-1">
                3. Talk &amp; Chat
              </span>
              Stream screen content with crystal-clear rendering and interact
              via built-in real-time chat.
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-8 text-center border-t border-white/5">
        <p className="text-xs text-gray-500 font-light">
          &copy; {new Date().getFullYear()} InstantShare. Secured via standard
          WebRTC end-to-end transport.
        </p>
      </footer>
    </div>
  );
}
