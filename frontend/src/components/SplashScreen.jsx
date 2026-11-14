export default function SplashScreen() {
  return (
    <main
      className="grid min-h-dvh min-w-0 place-items-center overflow-hidden bg-[#FAF7F2] px-4 sm:px-6"
      role="status"
      aria-live="polite"
      aria-label="Loading Sherize Employee Portal"
    >
      <div className="flex w-full max-w-[420px] min-w-0 flex-col items-center">
        <img
          src="/logo.png"
          alt="Sherize"
          className="h-[min(400px,82vw)] w-[min(400px,82vw)] object-contain"
        />

        <div className="-mt-20 h-1 w-full overflow-hidden rounded-full bg-[#E7DED4] sm:-mt-28" aria-hidden="true">
          <span className="block h-full w-2/5 origin-center rounded-full bg-[#2F2A26] animate-[sherize-splash-progress_1.35s_cubic-bezier(0.4,0,0.2,1)_infinite] motion-reduce:animate-pulse" />
        </div>

        <span className="sr-only">Restoring your employee session</span>
      </div>

      <style>{`
        @keyframes sherize-splash-progress {
          0% { transform: translateX(-125%) scaleX(0.65); }
          48% { transform: translateX(75%) scaleX(1.15); }
          100% { transform: translateX(300%) scaleX(0.65); }
        }
      `}</style>
    </main>
  )
}
