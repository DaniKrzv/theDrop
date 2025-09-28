import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { ImportBar } from '@/components/ImportBar'
import { ConnectWalletButton } from '@/components/wallet/ConnectWalletButton'
import { TruskyConnectButton } from '@/components/wallet/TruskyConnectButton'
import { FolderUploadPanel } from '@/components/trusky/FolderUploadPanel'

const ExplorePage = () => {
  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-soft"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Explorer</p>
          <h1 className="text-3xl font-semibold text-white">Découvrir de la musique</h1>
        </div>
        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
          <ConnectWalletButton className="rounded-full" />
          <TruskyConnectButton />
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-6 py-16 text-center text-slate-300 shadow-soft"
        aria-label="Suggestions musicales"
      >
        <Sparkles className="h-8 w-8 text-accent" aria-hidden />
        <h2 className="text-xl font-semibold text-white">Suggestions à venir</h2>
        <p className="max-w-xl text-sm">
          Bientôt vous trouverez ici des recommandations personnalisées basées sur vos écoutes et la communauté.
        </p>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-2"
        aria-label="Zone d'upload de musique"
      >
        <ImportBar />
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        aria-label="Upload Walrus - Folders"
      >
        <FolderUploadPanel />
      </motion.section>
    </div>
  )
}

export default ExplorePage
