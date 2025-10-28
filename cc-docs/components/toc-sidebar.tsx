"use client";

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface Heading {
  id: string;
  text: string;
  level: number;
}

export default function TocSidebar() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    // Extract headings from the current page
    const extractHeadings = () => {
      const headingElements = Array.from(
        document.querySelectorAll('article h2, article h3, article h4')
      );

      const headingData = headingElements
        .filter(heading => heading.id)
        .map(heading => ({
          id: heading.id,
          text: heading.textContent || '',
          level: Number(heading.tagName.substring(1)),
        }));

      setHeadings(headingData);
    };

    // Reset state when pathname changes
    setActiveId('');

    // Wait for content to be rendered
    const timeoutId = setTimeout(extractHeadings, 100);
    return () => clearTimeout(timeoutId);
  }, [pathname]);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the heading that's most visible at the top of the viewport
        const visibleHeadings = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => {
            // Sort by how close to the top of the viewport
            const aTop = a.boundingClientRect.top;
            const bTop = b.boundingClientRect.top;
            return Math.abs(aTop - 100) - Math.abs(bTop - 100);
          });

        if (visibleHeadings.length > 0) {
          setActiveId(visibleHeadings[0].target.id);
        }
      },
      {
        rootMargin: '0px 0px -70% 0px',
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1]
      }
    );

    headings.forEach(heading => {
      const element = document.getElementById(heading.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Update URL
      window.history.pushState(null, '', `#${id}`);
    }
  };

  return (
    <aside className="fixed top-16 right-0 z-30 w-64 h-screen pl-4 pr-8 py-12 hidden xl:block">
      <div className="space-y-4">
        <p className="font-semibold text-gray-900 dark:text-white">On this page</p>
        <nav>
          <ul className="space-y-2">
            {headings.map(heading => (
              <li 
                key={heading.id} 
                style={{ marginLeft: `${(heading.level - 2) * 1}rem` }}
              >
                <button
                  onClick={() => handleClick(heading.id)}
                  className={`block text-left transition-all duration-200 w-full ${
                    activeId === heading.id
                      ? 'text-gray-1200 hover:text-gray-900 dark:text-gray-1200 dark:hover:text-white text-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-sm'
                  }`}
                >
                  {heading.text}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
} 