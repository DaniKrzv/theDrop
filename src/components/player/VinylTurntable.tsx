import { motion } from 'framer-motion'

import type { Track } from '@/types/music'

export type VinylTurntableProps = {
  track?: Track
  isPlaying: boolean
}

export const VinylTurntable = ({ track, isPlaying }: VinylTurntableProps) => {
  return (
    <div className="relative flex flex-1 items-center justify-center">
      <motion.div
        className="relative flex h-[360px] w-[360px] items-center justify-center rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-black shadow-soft sm:h-[420px] sm:w-[420px]"
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ repeat: isPlaying ? Infinity : 0, duration: 12, ease: 'linear' }}
      >
        <div className="absolute inset-4 rounded-full border border-white/5 bg-gradient-to-br from-slate-700/60 via-slate-900/70 to-black" />
        <div className="absolute inset-10 rounded-full border border-black/40" />
        <div className="absolute inset-14 rounded-full border border-black/20" />
        <div className="absolute inset-20 rounded-full border border-black/30" />
        <div className="absolute inset-24 rounded-full border border-black/10" />
        <div className="absolute inset-[45%] rounded-full border border-white/40 bg-accent shadow-glow" />
        <div className="relative z-10 h-[120px] w-[120px] overflow-hidden rounded-full border-4 border-white/30 shadow-soft">
          {track?.coverDataUrl ? (
            <img src={track.coverDataUrl} alt={track.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-800 text-xs uppercase tracking-[0.2em] text-white/80">
              The Drop
            </div>
          )}
        </div>
      </motion.div>
      <motion.div
        className="absolute right-[-60px] top-16 hidden h-60 origin-top-right rotate-6 rounded-full border-2 border-slate-400 bg-gradient-to-br from-slate-500 to-slate-200 shadow-soft sm:block"
        animate={{ rotate: isPlaying ? 18 : 28 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      >
        <div className="absolute -left-12 top-4 h-16 w-12 rounded-full bg-gradient-to-b from-slate-500 to-slate-700 shadow-inner" />
        <div className="absolute bottom-2 left-[-6px] h-6 w-6 rounded-full bg-slate-950" />
      </motion.div>
    </div>
  )
}
