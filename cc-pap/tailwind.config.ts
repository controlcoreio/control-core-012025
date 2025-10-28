
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['72', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif'],
        sap: ['72', 'sans-serif'],
      },
      fontSize: {
        'sap-xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sap-sm': ['0.875rem', { lineHeight: '1.25rem' }],  // 14px (base)
        'sap-base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'sap-lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'sap-xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        'sap-2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        'sap-3xl': ['2rem', { lineHeight: '2.5rem' }],      // 32px
      },
      spacing: {
        'sap-0': '0',
        'sap-1': '0.25rem',    // 4px
        'sap-2': '0.5rem',     // 8px
        'sap-3': '0.75rem',    // 12px
        'sap-4': '1rem',       // 16px (base)
        'sap-5': '1.25rem',    // 20px
        'sap-6': '1.5rem',     // 24px
        'sap-8': '2rem',       // 32px
        'sap-10': '2.5rem',    // 40px
        'sap-12': '3rem',      // 48px
        'sap-16': '4rem',      // 64px
        'sap-20': '5rem',      // 80px
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        },
        // SAP Enterprise Semantic Colors
        'sap-corporate-blue': {
          50: '#e8f2ff',
          100: '#d1e4ff',
          500: '#0054b4',
          600: '#004a9f',
          700: '#003d85',
        },
        'sap-teal': {
          50: '#e0f2f1',
          100: '#b2dfdb',
          500: '#009688',
          600: '#00857a',
          700: '#00695c',
        },
        'sap-enterprise-green': {
          50: '#e8f5e8',
          100: '#c8e6c9',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
        },
        'sap-enterprise-red': {
          50: '#ffebee',
          100: '#ffcdd2',
          500: '#d32f2f',
          600: '#c62828',
          700: '#b71c1c',
        },
        'sap-enterprise-amber': {
          50: '#fff8e1',
          100: '#ffecb3',
          500: '#ffc107',
          600: '#ffb300',
          700: '#ff8f00',
        },
        'sap-neutral': {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#bdbdbd',
          500: '#9e9e9e',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        }
      },
      borderRadius: {
        lg: '0.375rem',     // SAP Medium radius
        md: '0.25rem',      // SAP Standard radius  
        sm: '0.125rem'      // SAP Small radius
      },
      boxShadow: {
        'sap-level-0': 'none',
        'sap-level-1': '0 0 0.125rem rgba(0, 0, 0, 0.12), 0 0.125rem 0.25rem rgba(0, 0, 0, 0.12)',
        'sap-level-2': '0 0 0.125rem rgba(0, 0, 0, 0.12), 0 0.25rem 0.75rem rgba(0, 0, 0, 0.12)',
        'sap-level-3': '0 0 0.125rem rgba(0, 0, 0, 0.12), 0 0.5rem 1.5rem rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out'
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
