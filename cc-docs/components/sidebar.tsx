"use client";

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarItem {
  title: string
  href: string
  items?: SidebarItem[]
}

const sidebarItems: SidebarItem[] = [
  {
    title: "Getting Started",
    href: "/guides/getting-started",
    items: [
      { title: "Introduction", href: "/guides/getting-started" },
      { title: "Installation", href: "/guides/installation" },
      { title: "Architecture", href: "/architecture" },
    ]
  },
  {
    title: "Deployment",
    href: "/guides/deployment",
    items: [
      { title: "Kickstart (Self-Hosted)", href: "/guides/deployment/kickstart" },
      { title: "Pro (Hybrid)", href: "/guides/deployment/pro" },
      { title: "Enterprise (Kubernetes)", href: "/guides/deployment/enterprise" },
    ]
  },
  {
    title: "Administration",
    href: "/guides/admin",
    items: [
      { title: "Administrator Guide", href: "/guides/admin" },
      { title: "DevOps Guide", href: "/guides/devops" },
      { title: "Security Best Practices", href: "/guides/security" },
    ]
  },
  {
    title: "Policy Management",
    href: "/guides/user-guide",
    items: [
      { title: "User Guide", href: "/guides/user-guide" },
      { title: "Rego Guidelines", href: "/guides/rego-guidelines" },
      { title: "Policy Templates", href: "/guides/policy-templates" },
      { title: "PBAC Best Practices", href: "/guides/pbac-best-practices" },
    ]
  },
  {
    title: "Integrations",
    href: "/integrations",
    items: [
      { title: "Overview", href: "/integrations" },
      { title: "PIP Getting Started", href: "/guides/pip-getting-started" },
      { title: "PIP Admin Guide", href: "/guides/pip-admin-guide" },
      { title: "PIP Developer Guide", href: "/guides/pip-developer-guide" },
    ]
  },
  {
    title: "Demo Application",
    href: "/guides/demo-application",
    items: [
      { title: "Demo Guide", href: "/guides/demo-application" },
    ]
  },
  {
    title: "API Reference",
    href: "/guides/api-reference",
    items: [
      { title: "REST API", href: "/guides/api-reference" },
      { title: "Policies as Code API", href: "/api/policies-as-code" },
      { title: "IDE Integration API", href: "/api/ide-integration" },
    ]
  },
  {
    title: "Enterprise",
    href: "/enterprise",
    items: [
      { title: "Architecture", href: "/enterprise/architecture" },
      { title: "Deploy All Components", href: "/enterprise/deployment/all" },
      { title: "Deploy Sidecar", href: "/enterprise/deployment/sidecar" },
      { title: "Configure", href: "/enterprise/configure" },
      { title: "Policies", href: "/enterprise/policies" },
    ]
  },
  {
    title: "Help & Support",
    href: "/troubleshooting",
    items: [
      { title: "Troubleshooting", href: "/troubleshooting" },
      { title: "FAQ", href: "/faq" },
    ]
  }
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/' && pathname === '/') return true
    if (href !== '/' && pathname.startsWith(href)) return true
    return false
  }

  return (
    <aside className="fixed top-16 left-0 z-40 w-64 h-screen bg-white dark:bg-brand-dark border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
      <nav className="p-4 space-y-2">
        <Link
          href="/"
          className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === '/' 
              ? 'bg-brand-primary/10 font-semibold dark:text-brand-primary' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
        >
          Welcome
        </Link>
        
        {sidebarItems.map((section) => (
          <div key={section.title} className="space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              {section.title}
            </div>
            {section.items?.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 ml-3 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'bg-brand-primary/10 font-semibold dark:text-brand-primary'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {item.title}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
} 