import { motion } from "motion/react";

interface LoaderProps {
  message?: string;
}

export default function Loader({ message = "Processing with Manthan360..." }: LoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4" id="loader-wrapper">
      <div className="relative w-16 h-16" id="loader-spinner-container">
        {/* Futuristic outer pulse */}
        <motion.div
          id="loader-pulse"
          className="absolute inset-0 rounded-full bg-cyan-500/20 border border-cyan-400"
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Fast inner spinner */}
        <motion.div
          id="loader-spinner"
          className="absolute inset-2 rounded-full border-t-2 border-r-2 border-cyan-400"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
      <motion.p
        id="loader-message"
        className="mt-6 text-sm text-cyan-200 font-mono tracking-wider text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {message}
      </motion.p>
    </div>
  );
}
