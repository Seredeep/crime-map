/**
 * INCIDENT COLOR USAGE EXAMPLES
 * =============================
 *
 * This file demonstrates how to use the incident color system
 * consistently across the application.
 */

import { IncidentType, getIncidentColorClasses, getIncidentColorConfig } from './types';

// #region Example Usage Functions

/**
 * Example: Get color configuration for a specific incident type
 */
export const getIncidentColors = (incidentType: IncidentType) => {
  return getIncidentColorConfig(incidentType);
};

/**
 * Example: Get CSS classes for consistent styling
 */
export const getIncidentStyles = (incidentType: IncidentType) => {
  return getIncidentColorClasses(incidentType);
};

/**
 * Example: Apply colors to incident tags
 */
export const getIncidentTagStyles = (incidentType: IncidentType) => {
  const colors = getIncidentColorConfig(incidentType);

  return {
    container: `bg-gradient-to-r ${colors.gradient} text-white px-3 py-1.5 rounded-full text-xs font-semibold border-2 ${colors.border} shadow-lg`,
    icon: `${colors.text}`,
    hover: `hover:${colors.hover} hover:scale-105 transition-all duration-200`
  };
};

/**
 * Example: Apply colors to incident cards
 */
export const getIncidentCardStyles = (incidentType: IncidentType) => {
  const colors = getIncidentColorConfig(incidentType);

  return {
    border: `border-2 ${colors.border}`,
    background: `bg-gradient-to-r ${colors.bg}`,
    hover: `hover:${colors.hover}`,
    accent: `${colors.text}`,
    shadow: `shadow-lg shadow-${colors.border.replace('border-', '')}/25`
  };
};

/**
 * Example: Apply colors to status indicators
 */
export const getStatusIndicatorStyles = (status: 'pending' | 'verified' | 'resolved') => {
  const statusColors = {
    pending: {
      gradient: 'from-amber-600 to-orange-600',
      text: 'text-amber-100',
      border: 'border-amber-500'
    },
    verified: {
      gradient: 'from-blue-600 to-cyan-600',
      text: 'text-blue-100',
      border: 'border-blue-500'
    },
    resolved: {
      gradient: 'from-green-600 to-emerald-600',
      text: 'text-green-100',
      border: 'border-green-500'
    }
  };

  return statusColors[status];
};

// #endregion

// #region Usage Examples

/**
 * Example: How to use in a React component
 *
 * ```tsx
 * import { getIncidentTagStyles, getIncidentCardStyles } from '@/lib/services/incidents/colorUsage';
 *
 * const IncidentCard = ({ incident, incidentType }) => {
 *   const tagStyles = getIncidentTagStyles(incidentType);
 *   const cardStyles = getIncidentCardStyles(incidentType);
 *
 *   return (
 *     <div className={`p-4 rounded-lg ${cardStyles.border} ${cardStyles.background} ${cardStyles.hover}`}>
 *       <span className={`${tagStyles.container} ${tagStyles.hover}`}>
 *         {incidentType.label}
 *       </span>
 *     </div>
 *   );
 * };
 * ```
 */

/**
 * Example: How to use in a filter component
 *
 * ```tsx
 * import { getIncidentColors } from '@/lib/services/incidents/colorUsage';
 *
 * const IncidentTypeFilter = ({ incidentTypes }) => {
 *   return (
 *     <div className="flex flex-wrap gap-2">
 *       {incidentTypes.map(type => {
 *         const colors = getIncidentColors(type);
 *
 *         return (
 *           <button
 *             key={type.id}
 *             className={`px-3 py-2 rounded-lg ${colors.bg} ${colors.text} ${colors.border} ${colors.hover}`}
 *           >
 *             {type.label}
 *           </button>
 *         );
 *       })}
 *     </div>
 *   );
 * };
 * ```
 */

// #endregion

// #region Color Palette Summary

/**
 * Available color palette (reduced and professional):
 *
 * Primary Colors:
 * - red: Critical incidents (assault, violence)
 * - orange: Disruptions and warnings
 * - amber: Threats and alerts
 * - blue: Neutral incidents (theft)
 * - purple: Serious crimes (robbery, home invasion)
 * - indigo: Violence and kidnapping
 *
 * Secondary Colors:
 * - cyan: Suspicious activity
 * - teal: Property damage and extortion
 * - green: Motorcycle crimes
 * - emerald: Motorcycle crimes
 * - pink: Armed crimes
 * - lime: Stealth crimes
 * - yellow: Stealth theft
 * - gray: Uncategorized incidents
 *
 * Color Intensity:
 * - All colors use 600+ variants for less flashy appearance
 * - Background opacity reduced to 10% (from 15%)
 * - Hover states use 20% opacity (from 25%)
 * - Added gradient support for modern UI elements
 */

// #endregion
