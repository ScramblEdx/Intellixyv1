import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Check, Star, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

const containerVariant = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function Plans() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const formatMessage = (planName: string) => {
    return encodeURIComponent(`Olá, gostaria de fazer o upgrade para o plano ${planName}. Meu email é ${user?.email}.`);
  };

  const handleUpgrade = async (planName: string) => {
    if (!user) return;
    
    setLoading(true);
    try {
      toast.info('Redirecionando para o WhatsApp...');
      
      // Redireciona para o WhatsApp
      const message = formatMessage(planName);
      window.open(`https://wa.me/5548988028756?text=${message}`, '_blank');
      
    } catch (error) {
      toast.error('Erro ao redirecionar. Tente novamente.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const currentPlan = user?.plan || 'free';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Acelere a <span className="text-blue-600 dark:text-blue-400">criação de provas</span>
        </h1>
        <p className="max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
          Escolha o plano ideal e economize horas do seu dia com a geração avançada por Inteligência Artificial.
        </p>
      </div>

      {user && (
        <div className="text-center">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Seu plano atual é
          </p>
          <span className="inline-flex items-center justify-center px-4 py-1.5 mt-2 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full dark:bg-blue-900/40 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10">
            {currentPlan === 'free' && 'GRATUITO'}
            {currentPlan === 'pago' && 'PAGO'}
            {currentPlan === 'deluxe' && 'DELUXE'}
          </span>
        </div>
      )}

      <motion.div 
        variants={containerVariant} 
        initial="hidden" 
        animate="show" 
        className="grid grid-cols-1 gap-8 pt-8 lg:grid-cols-3 lg:gap-12"
      >
        {/* FREE PLAN */}
        <motion.div variants={itemVariant} className={`relative flex flex-col p-8 bg-white border rounded-3xl shadow-sm dark:bg-gray-800/50 ${currentPlan === 'free' ? 'border-gray-500/50 ring-2 ring-gray-500/50' : 'border-gray-200 dark:border-gray-700'}`}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white inline-flex items-center gap-2">
              Básico <span className="text-gray-500"><Star size={20} /></span>
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Para professores que querem experimentar o poder da IA.</p>
          </div>
          <p className="mt-4 flex flex-baseline text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Grátis
          </p>
          <ul className="flex-1 mt-8 space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <li className="flex items-center gap-3">
              <Check className="text-gray-500 dark:text-gray-400 shrink-0" size={20} />
              <span>Limite de <b>2</b> provas por mês</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-gray-500 dark:text-gray-400 shrink-0" size={20} />
              <span>Recursos básicos de criação</span>
            </li>
          </ul>
          <button
            disabled={currentPlan === 'free'}
            className={`mt-8 block w-full px-4 py-3 text-sm font-semibold text-center border rounded-xl transition ${
              currentPlan === 'free'
                ? 'bg-gray-100 border-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'
                : 'text-gray-700 bg-white border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700'
            }`}
          >
            {currentPlan === 'free' ? 'Plano Atual' : 'Plano Gratuito'}
          </button>
        </motion.div>

        {/* PAGO PLAN */}
        <motion.div variants={itemVariant} className={`relative flex flex-col p-8 bg-blue-50/80 backdrop-blur-md rounded-3xl shadow-xl dark:bg-[#011525]/90 
          ${currentPlan === 'pago' ? 'border-2 border-blue-400 ring-4 ring-blue-400/30' : 'border border-blue-200/60 dark:border-blue-500/40 ring-1 ring-inset ring-white/60 dark:ring-white/10'}
          before:absolute before:inset-0 before:-z-10 before:rounded-3xl before:bg-gradient-to-tr before:from-blue-200/30 before:via-white/40 before:to-transparent before:pointer-events-none`}>
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-300 inline-flex items-center gap-2">
              Profissional <span className="text-blue-500"><Zap size={20} /></span>
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Ideal para a rotina escolar intensa e provas frequentes.</p>
          </div>
          <p className="mt-4 flex items-baseline text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            <span className="text-2xl font-medium text-gray-500 mr-1">R$</span>15<span className="ml-1 text-xl font-medium text-gray-500 dark:text-gray-400">/mês</span>
          </p>
          <ul className="flex-1 mt-8 space-y-4 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center gap-3">
              <Check className="text-blue-500 shrink-0" size={20} />
              <span>Geração <b>mais rápida</b> da IA</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-blue-500 shrink-0" size={20} />
              <span>Até <b>5</b> provas geradas por mês</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-blue-500 shrink-0" size={20} />
              <span>Sem limite diário</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-blue-500 shrink-0" size={20} />
              <span>Estabilidade e melhor desempenho</span>
            </li>
          </ul>
          <button
            onClick={() => handleUpgrade('Profissional')}
            disabled={currentPlan === 'pago' || loading}
             className={`mt-8 block w-full px-4 py-3 text-sm font-semibold text-center border rounded-xl transition shadow-sm ${
              currentPlan === 'pago'
                ? 'bg-blue-100 border-blue-200 text-blue-700 cursor-not-allowed dark:bg-blue-900/50 dark:border-blue-800 dark:text-blue-300'
                : 'text-white bg-blue-600 border-transparent hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500'
            }`}
          >
            {currentPlan === 'pago' ? 'Plano Atual' : 'Fazer upgrade'}
          </button>
        </motion.div>

        {/* DELUXE PLAN */}
        <motion.div variants={itemVariant} className={`relative flex flex-col p-8 bg-[#111111] overflow-hidden rounded-3xl shadow-2xl
          ${currentPlan === 'deluxe' ? 'border-2 border-amber-400 ring-4 ring-amber-400/30' : 'border border-amber-500/40'}
          `}>
          {/* Fundo simulando carbono e brilhos */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-500/10 via-purple-500/5 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Crown size={120} className="text-amber-300" />
          </div>
          
          <div className="mb-4 relative z-10">
             <div className="inline-flex py-1 px-3 mb-4 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase">
              Recomendado
            </div>
            <h3 className="text-xl font-semibold text-white inline-flex items-center gap-2">
              Deluxe <span className="text-amber-400"><Crown size={20} /></span>
            </h3>
            <p className="mt-2 text-sm text-zinc-400">A experiência máxima para instituições e professores exigentes.</p>
          </div>
          <p className="mt-4 flex flex-baseline text-5xl font-extrabold tracking-tight text-white relative z-10">
            <span className="text-2xl font-medium text-zinc-500 mr-1">R$</span>45<span className="ml-1 text-xl font-medium text-zinc-500">/mês</span>
          </p>
          <ul className="flex-1 mt-8 space-y-4 text-sm text-zinc-300 relative z-10">
            <li className="flex items-center gap-3">
              <Check className="text-amber-400 shrink-0" size={20} />
              <span>Até <b>10</b> provas geradas por mês</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-amber-400 shrink-0" size={20} />
              <span>Cronogramas <b>Ilimitados</b></span>
            </li>
             <li className="flex items-center gap-3">
              <Check className="text-amber-400 shrink-0" size={20} />
              <span>Geração super-rápida (modelo dedicado)</span>
            </li>
            <li className="flex items-center gap-3">
              <Check className="text-purple-400 shrink-0" size={20} />
              <span>Acesso antecipado a funções exclusivas</span>
            </li>
          </ul>
          <button
            onClick={() => handleUpgrade('Deluxe')}
            disabled={currentPlan === 'deluxe' || loading}
             className={`mt-8 block w-full px-4 py-3 text-sm font-bold text-center rounded-xl transition shadow-lg relative z-10 ${
              currentPlan === 'deluxe'
                ? 'bg-zinc-800 text-amber-500 cursor-not-allowed border border-amber-500/30'
                : 'text-black bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 ring-1 ring-inset ring-amber-300/40'
            }`}
          >
            {currentPlan === 'deluxe' ? 'Plano Atual' : 'Obter Deluxe'}
          </button>
        </motion.div>

      </motion.div>

      <div className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Precisa de um plano institucional? <a href="https://wa.me/5548988028756" className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400" target="_blank" rel="noreferrer">Fale conosco.</a></p>
      </div>
    </div>
  );
}
