import React, { useState, useEffect } from 'react';

interface LogoProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showText?: boolean;
}

const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-2xl' },
    xl: { icon: 64, text: 'text-3xl' },
};

export const Logo: React.FC<LogoProps> = ({
    className = '',
    size = 'md',
    showText = true
}) => {
    const { icon, text } = sizes[size];
    const [isDark, setIsDark] = useState(false);

    // Detect theme changes
    useEffect(() => {
        const checkDarkMode = () => {
            setIsDark(document.documentElement.classList.contains('dark'));
        };

        checkDarkMode();

        // Watch for theme changes
        const observer = new MutationObserver(checkDarkMode);
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => observer.disconnect();
    }, []);

    // Logo naming: *_dark (nero) → light theme, *_light (bianco) → dark theme
    // Color variant used as fallback/hover
    const logoSrc = isDark
        ? '/icons/AeroFTP_simbol_light.png'  // White logo for dark theme
        : '/icons/AeroFTP_simbol_dark.png';  // Black/dark logo for light theme

    return (
        <div className={`flex items-center gap-2.5 ${className}`}>
            {/* AeroFTP Logo */}
            <img
                src={logoSrc}
                alt="AeroFTP"
                width={icon}
                height={icon}
                className="shrink-0 object-contain"
                onError={(e) => {
                    // Fallback to color version if theme variant not found
                    (e.target as HTMLImageElement).src = '/icons/AeroFTP_simbol_color.png';
                }}
            />

            {/* Text */}
            {showText && (
                <span className={`font-semibold ${text} bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400 bg-clip-text text-transparent`}>
                    AeroFTP
                </span>
            )}
        </div>
    );
};

export default Logo;
