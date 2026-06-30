import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const RatingBar = ({ 
  label, 
  icon, 
  displayValue, 
  rating, 
  color, 
  explanation, 
  isWinner,
  isHigherBetter 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (rating === null) {
    return (
      <div className="py-2 border-b border-gray-200 dark:border-dark-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{icon}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
          </div>
          <span className="text-sm text-gray-400">N/A</span>
        </div>
      </div>
    );
  }

  const colorClasses = {
    green: {
      bg: 'bg-green-500',
      text: 'text-green-600 dark:text-green-400',
      light: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
    },
    yellow: {
      bg: 'bg-yellow-500',
      text: 'text-yellow-600 dark:text-yellow-400',
      light: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-200 dark:border-yellow-800',
    },
    red: {
      bg: 'bg-red-500',
      text: 'text-red-600 dark:text-red-400',
      light: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
    },
  };

  const colorStyle = colorClasses[color] || colorClasses.yellow;
  const percentage = (rating / 10) * 100;

  return (
    <div className="py-3 border-b border-gray-100 dark:border-dark-700 last:border-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          {isWinner && (
            <span className="text-xs bg-yellow-500 text-gray-900 px-1.5 py-0.5 rounded-full font-bold">
              🏆
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            {displayValue}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 mt-1.5">
        <div className="flex-1 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full ${colorStyle.bg} rounded-full`}
          />
        </div>
        <span className={`text-sm font-bold ${colorStyle.text} min-w-[45px] text-right`}>
          {rating.toFixed(1)}
        </span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors"
        >
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <AnimatePresence>
        {isExpanded && explanation && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={`mt-3 p-3 rounded-lg ${colorStyle.light} ${colorStyle.border} border`}>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {explanation.summary}
              </p>
              <ul className="mt-1.5 space-y-0.5">
                {explanation.details?.map((detail, idx) => (
                  <li key={idx} className="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1.5">
                    <span className="text-green-500">✓</span>
                    {detail}
                  </li>
                ))}
              </ul>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                {isHigherBetter ? '↑ Higher is better' : '↓ Lower is better'}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RatingBar;