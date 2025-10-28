import React from 'react'
import Link from 'next/link'
import Sidebar from '@/components/sidebar'
import ThemeToggle from '@/components/theme-toggle'
import TocSidebar from '@/components/toc-sidebar'
import './globals.css'

export const metadata = {
  title: 'Control Core Documentation',
  description: 'User and Admin Guides for Control Core',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white dark:bg-brand-dark transition-colors">
        <div className="min-h-screen">
          {/* Header */}
          <header className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-brand-dark border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center space-x-4">
                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-brand-primary">
                  Control Core
                </Link>
                <span className="text-sm text-gray-500 dark:text-gray-400">Docs</span>
              </div>
              <div className="flex items-center space-x-4">
                <nav className="hidden md:flex items-center space-x-6">
                  <Link href="/" className="text-gray-600 hover:text-brand-primary dark:text-gray-300 dark:hover:text-brand-primary text-sm transition-colors">
                    Docs
                  </Link>
                </nav>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <div className="pl-64 xl:pr-64">
            <main className="pt-16">
              <div className="max-w-4xl mx-auto px-8 py-12">
                <article className="prose prose-gray max-w-none dark:prose-invert">
                  {children}
                </article>
              </div>
            </main>
          </div>

          {/* Table of Contents Sidebar */}
          <TocSidebar />
        </div>
      </body>
    </html>
  )
} 