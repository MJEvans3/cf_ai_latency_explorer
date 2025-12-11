import { motion } from "framer-motion";

export function Loader() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-slate-900 z-50 flex flex-col items-center justify-center"
    >
      {/* Animated globe */}
      <motion.div
        className="relative w-32 h-32 mb-8"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
      >
        {/* Globe rings */}
        <div className="absolute inset-0 rounded-full border-2 border-slate-700" />
        <div className="absolute inset-3 rounded-full border border-slate-600" />
        <div className="absolute inset-6 rounded-full border border-slate-500/50" />

        {/* Orbiting edge location dots */}
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-2.5 h-2.5 bg-orange-500 rounded-full shadow-lg shadow-orange-500/50"
            style={{
              top: "50%",
              left: "50%",
              marginTop: "-5px",
              marginLeft: "-5px",
            }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * 56,
              y: Math.sin((angle * Math.PI) / 180) * 56,
              opacity: [0.4, 1, 0.4],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              opacity: { repeat: Infinity, duration: 1.5, delay: i * 0.15 },
              scale: { repeat: Infinity, duration: 1.5, delay: i * 0.15 },
            }}
          />
        ))}

        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-4 h-4 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </div>
      </motion.div>

      {/* Loading text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-white text-xl font-semibold mb-2">
          Locating Your Edge
        </h2>
        <p className="text-slate-400 text-sm">
          Finding the fastest path to you...
        </p>
      </motion.div>

      {/* Progress bar */}
      <motion.div className="mt-8 w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Cloudflare branding */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-8 text-slate-500 text-sm flex items-center gap-2"
      >
        <CloudflareIcon className="w-5 h-5" />
        <span>Powered by Cloudflare</span>
      </motion.div>
    </motion.div>
  );
}

function CloudflareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.5088 16.8447C16.6408 16.4537 16.5928 16.0257 16.3808 15.6717C16.1688 15.3177 15.8178 15.0687 15.4108 14.9827L8.09279 14.4217C8.03779 14.4147 7.99079 14.3877 7.95979 14.3447C7.92879 14.3027 7.91679 14.2497 7.92679 14.1987C7.94479 14.1077 8.02679 14.0397 8.12279 14.0327L15.5738 13.5837C16.6038 13.5267 17.7158 12.6997 18.1198 11.7157L18.9368 9.72571C18.9788 9.62171 18.9998 9.51071 18.9998 9.39871C18.9998 8.09871 17.9328 7.04871 16.6138 7.04871H7.40379C4.32779 7.04871 1.81879 9.50971 1.76879 12.5607C1.74279 14.1347 2.36379 15.6247 3.49379 16.7417C4.62479 17.8597 6.12879 18.4617 7.70679 18.4247L15.4298 18.2577C15.5228 18.2557 15.6138 18.2317 15.6948 18.1877C15.8558 18.0997 15.9698 17.9457 16.0098 17.7647L16.5088 16.8447Z" />
      <path d="M19.1667 11.7157C19.1247 11.8337 19.1527 11.9637 19.2407 12.0547C19.3287 12.1457 19.4597 12.1807 19.5807 12.1447C19.8117 12.0787 20.0537 12.0447 20.2997 12.0447C21.7907 12.0447 22.9997 13.2537 22.9997 14.7447C22.9997 14.9637 22.9727 15.1767 22.9217 15.3807C22.8867 15.5177 22.9297 15.6627 23.0337 15.7557C23.1387 15.8487 23.2877 15.8747 23.4177 15.8237C23.7867 15.6797 24.0917 15.3867 24.2367 14.9957C24.3397 14.7157 24.3947 14.4157 24.3947 14.1037C24.3947 12.3637 22.9827 10.9517 21.2427 10.9517C20.4557 10.9517 19.7337 11.2347 19.1667 11.7157Z" />
    </svg>
  );
}
