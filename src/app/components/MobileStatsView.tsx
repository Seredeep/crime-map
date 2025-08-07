'use client';

import { fetchIncidents } from '@/lib/services/incidents/incidentService';
import { Incident } from '@/lib/types/global';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FiAlertTriangle, FiClock, FiEye, FiMapPin, FiShield, FiTrendingUp } from 'react-icons/fi';

interface MobileStatsViewProps {
  className?: string;
}

const MobileStatsView = ({ className = '' }: MobileStatsViewProps) => {
  const { data: session } = useSession();
  const t = useTranslations('Statistics');
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar incidentes según el período seleccionado
  useEffect(() => {
    const loadIncidentStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const today = new Date();
        let daysAgo = 7;

        switch (selectedPeriod) {
          case 'day':
            daysAgo = 1;
            break;
          case 'week':
            daysAgo = 7;
            break;
          case 'month':
            daysAgo = 30;
            break;
          case 'year':
            daysAgo = 365;
            break;
        }

        const fromDate = new Date();
        fromDate.setDate(today.getDate() - daysAgo);

        const currentIncidents = await fetchIncidents({
          dateFrom: fromDate.toISOString().split('T')[0],
          dateTo: today.toISOString().split('T')[0]
        });

        setIncidents(currentIncidents);
      } catch (err) {
        console.error('Error loading incident stats:', err);
        setError(t('errorLoadingStats'));
      } finally {
        setLoading(false);
      }
    };

    loadIncidentStats();
  }, [selectedPeriod, t]);

  const periods = [
    { id: 'day', label: t('today') },
    { id: 'week', label: t('week') },
    { id: 'month', label: t('month') },
    { id: 'year', label: t('year') }
  ];

  // Calcular métricas simples y útiles
  const totalIncidents = incidents.length;
  const verifiedIncidents = incidents.filter(i => i.status === 'verified').length;
  const pendingIncidents = incidents.filter(i => !i.status || i.status === 'pending').length;
  const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;

  // Determinar nivel de seguridad basado en incidentes
  const getSafetyLevel = () => {
    if (totalIncidents === 0) return { level: 'excellent', color: 'text-green-400', bg: 'bg-green-500/20' };
    if (totalIncidents <= 2) return { level: 'good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
    if (totalIncidents <= 5) return { level: 'moderate', color: 'text-yellow-400', bg: 'bg-yellow-500/20' };
    return { level: 'attention', color: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const safetyLevel = getSafetyLevel();

  if (loading) {
    return (
      <div className={`w-full h-full bg-gray-900 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">{t('loadingStats')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative overflow-hidden ${className}`}>
      {/* Simple Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"></div>

      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-gray-800/90 backdrop-blur-sm border-b border-gray-600/30 p-4">
          <div className="flex items-center mb-4">
            <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
          </div>

          {/* Period selector */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {periods.map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  selectedPeriod === period.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 pb-24 overflow-y-auto">
          {/* Safety Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 rounded-xl p-6 ${safetyLevel.bg} border border-gray-700/50 backdrop-blur-sm shadow-lg`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <FiShield className={`w-8 h-8 mr-3 ${safetyLevel.color}`} />
                <div>
                  <h3 className="text-xl font-bold text-white">{t('securityStatus')}</h3>
                  <p className={`text-lg font-semibold ${safetyLevel.color}`}>
                    {t(safetyLevel.level)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{totalIncidents}</div>
                <div className="text-sm text-gray-400">{t('totalReports')}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-400">{verifiedIncidents}</div>
                <div className="text-xs text-gray-400">{t('verified')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">{pendingIncidents}</div>
                <div className="text-xs text-gray-400">{t('pending')}</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400">{resolvedIncidents}</div>
                <div className="text-xs text-gray-400">{t('resolved')}</div>
              </div>
            </div>
          </motion.div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-blue-500/20 mr-3">
                  <FiEye className="w-5 h-5 text-blue-400" />
                </div>
                <div className="text-sm text-gray-400">{t('verificationRate')}</div>
              </div>
              <div className="text-2xl font-bold text-white">
                {totalIncidents > 0 ? Math.round((verifiedIncidents / totalIncidents) * 100) : 0}%
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center mb-3">
                <div className="p-2 rounded-lg bg-green-500/20 mr-3">
                  <FiClock className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-sm text-gray-400">{t('resolutionRate')}</div>
              </div>
              <div className="text-2xl font-bold text-white">
                {totalIncidents > 0 ? Math.round((resolvedIncidents / totalIncidents) * 100) : 0}%
              </div>
            </motion.div>
          </div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-gray-700/50 shadow-lg"
          >
            <div className="flex items-center mb-4">
              <FiTrendingUp className="w-5 h-5 mr-2 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">{t('recentActivity')}</h3>
            </div>

            {totalIncidents === 0 ? (
              <div className="text-center py-8">
                <FiMapPin className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">{t('noIncidentsReported')}</p>
                <p className="text-sm text-gray-500 mt-1">{t('periodSelected', { period: periods.find(p => p.id === selectedPeriod)?.label?.toLowerCase() || '' })}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                  <div className="flex items-center">
                    <FiAlertTriangle className="w-4 h-4 text-red-400 mr-2" />
                    <span className="text-white">{t('incidentsReported')}</span>
                  </div>
                  <span className="text-lg font-bold text-white">{totalIncidents}</span>
                </div>

                {verifiedIncidents > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg">
                    <div className="flex items-center">
                      <FiEye className="w-4 h-4 text-blue-400 mr-2" />
                      <span className="text-white">{t('incidentsVerified')}</span>
                    </div>
                    <span className="text-lg font-bold text-blue-400">{verifiedIncidents}</span>
                  </div>
                )}

                {resolvedIncidents > 0 && (
                  <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg">
                    <div className="flex items-center">
                      <FiClock className="w-4 h-4 text-green-400 mr-2" />
                      <span className="text-white">{t('incidentsResolved')}</span>
                    </div>
                    <span className="text-lg font-bold text-green-400">{resolvedIncidents}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl backdrop-blur-sm"
            >
              <p className="text-red-400 text-sm">{error}</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileStatsView;
