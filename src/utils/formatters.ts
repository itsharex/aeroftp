/**
 * Utility formatting functions
 */

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

/**
 * Format transfer speed
 */
export const formatSpeed = (bps: number): string => formatBytes(bps) + '/s';

/**
 * Format estimated time remaining
 */
export const formatETA = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
};

/**
 * Format date string from "2025-12-17 00:36" to "Dec 17 00:36"
 */
export const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}:\d{2})/);
    if (!match) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[parseInt(match[2], 10) - 1];
    const day = parseInt(match[3], 10);
    return `${month} ${day} ${match[4]}`;
};
