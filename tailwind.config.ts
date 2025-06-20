import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			manrope: ['Manrope', 'sans-serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		spacing: {
  			'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
  			'safe-area-inset-top': 'env(safe-area-inset-top)',
  			'safe-area-inset-left': 'env(safe-area-inset-left)',
  			'safe-area-inset-right': 'env(safe-area-inset-right)'
  		},
  		height: {
  			'safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
  			'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
  		},
  				minHeight: {
			'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
		},
		keyframes: {
			'word-cycle': {
				'10%': { transform: 'translateY(-102%)' },
				'25%': { transform: 'translateY(-100%)' },
				'35%': { transform: 'translateY(-202%)' },
				'50%': { transform: 'translateY(-200%)' },
				'60%': { transform: 'translateY(-302%)' },
				'75%': { transform: 'translateY(-300%)' },
				'85%': { transform: 'translateY(-402%)' },
				'100%': { transform: 'translateY(-400%)' }
			}
		},
		animation: {
			'word-cycle': 'word-cycle 4s infinite'
		}
	}
},
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
