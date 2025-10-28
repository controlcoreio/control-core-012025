
import React from 'react';
import {
  // Solid icons for primary actions and important elements
  HomeIcon,
  ShieldCheckIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  BookOpenIcon,
  ServerIcon,
  GlobeAltIcon,
  CircleStackIcon as DatabaseIcon,
  CloudIcon,
  UserIcon,
  UsersIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  DocumentCheckIcon,
  ChartBarIcon as ActivityIcon,
  ArrowTrendingUpIcon as TrendingUpIcon,
  LinkIcon,
  PencilIcon,
  TrashIcon,
  ArchiveBoxIcon,
  CodeBracketIcon,
  ShareIcon,
  SunIcon,
  MoonIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  ChatBubbleLeftRightIcon,
  PowerIcon,
  DocumentTextIcon,
  KeyIcon,
  LockClosedIcon,
  EyeSlashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
  FolderIcon,
  CodeBracketSquareIcon,
} from '@heroicons/react/24/solid';

import {
  // Outline versions for secondary actions
  HomeIcon as HomeIconOutline,
  ShieldCheckIcon as ShieldCheckIconOutline,
  BeakerIcon as BeakerIconOutline,
  ClipboardDocumentListIcon as ClipboardDocumentListIconOutline,
  Cog6ToothIcon as Cog6ToothIconOutline,
  BookOpenIcon as BookOpenIconOutline,
} from '@heroicons/react/24/outline';

export type EnterpriseIconName = 
  | 'home'
  | 'shield'
  | 'test-tube'
  | 'clipboard'
  | 'settings'
  | 'credit-card'
  | 'book'
  | 'server'
  | 'globe'
  | 'database'
  | 'cloud'
  | 'user'
  | 'users'
  | 'eye'
  | 'eye-slash'
  | 'chevron-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'chevron-up'
  | 'arrow-right'
  | 'arrow-left'
  | 'arrow-up'
  | 'arrow-down'
  | 'plus'
  | 'minus'
  | 'x-mark'
  | 'check'
  | 'exclamation-triangle'
  | 'information-circle'
  | 'light-bulb'
  | 'document-check'
  | 'activity'
  | 'trending-up'
  | 'link'
  | 'pencil'
  | 'trash'
  | 'archive'
  | 'code'
  | 'share'
  | 'sun'
  | 'moon'
  | 'bell'
  | 'question-mark'
  | 'chat'
  | 'power'
  | 'document'
  | 'key'
  | 'lock'
  | 'search'
  | 'filter'
  | 'adjustments'
  | 'folder'
  | 'git-branch'
  | 'code-square';

const iconMap = {
  'home': HomeIcon,
  'shield': ShieldCheckIcon,
  'test-tube': BeakerIcon,
  'clipboard': ClipboardDocumentListIcon,
  'settings': Cog6ToothIcon,
  'credit-card': CreditCardIcon,
  'book': BookOpenIcon,
  'server': ServerIcon,
  'globe': GlobeAltIcon,
  'database': DatabaseIcon,
  'cloud': CloudIcon,
  'user': UserIcon,
  'users': UsersIcon,
  'eye': EyeIcon,
  'eye-slash': EyeSlashIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-up': ChevronUpIcon,
  'arrow-right': ArrowRightIcon,
  'arrow-left': ArrowLeftIcon,
  'arrow-up': ArrowUpIcon,
  'arrow-down': ArrowDownIcon,
  'plus': PlusIcon,
  'minus': MinusIcon,
  'x-mark': XMarkIcon,
  'check': CheckIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  'information-circle': InformationCircleIcon,
  'light-bulb': LightBulbIcon,
  'document-check': DocumentCheckIcon,
  'activity': ActivityIcon,
  'trending-up': TrendingUpIcon,
  'link': LinkIcon,
  'pencil': PencilIcon,
  'trash': TrashIcon,
  'archive': ArchiveBoxIcon,
  'code': CodeBracketIcon,
  'share': ShareIcon,
  'sun': SunIcon,
  'moon': MoonIcon,
  'bell': BellIcon,
  'question-mark': QuestionMarkCircleIcon,
  'chat': ChatBubbleLeftRightIcon,
  'power': PowerIcon,
  'document': DocumentTextIcon,
  'key': KeyIcon,
  'lock': LockClosedIcon,
  'search': MagnifyingGlassIcon,
  'filter': FunnelIcon,
  'adjustments': AdjustmentsHorizontalIcon,
  'folder': FolderIcon,
  'git-branch': CodeBracketSquareIcon,
  'code-square': CodeBracketSquareIcon,
};

const outlineIconMap = {
  'home': HomeIconOutline,
  'shield': ShieldCheckIconOutline,
  'test-tube': BeakerIconOutline,
  'clipboard': ClipboardDocumentListIconOutline,
  'settings': Cog6ToothIconOutline,
  'book': BookOpenIconOutline,
};

interface EnterpriseIconProps {
  name: EnterpriseIconName;
  size?: number | string;
  className?: string;
  variant?: 'solid' | 'outline';
}

export function EnterpriseIcon({ 
  name, 
  size = 20, 
  className = '', 
  variant = 'solid' 
}: EnterpriseIconProps) {
  const IconComponent = variant === 'outline' && outlineIconMap[name as keyof typeof outlineIconMap] 
    ? outlineIconMap[name as keyof typeof outlineIconMap]
    : iconMap[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`);
    return null;
  }

  const sizeStyle = typeof size === 'number' ? { width: size, height: size } : {};
  
  return (
    <IconComponent 
      className={`text-current ${className}`}
      style={sizeStyle}
    />
  );
}

// Export individual icons for direct use if needed
export const Icons = iconMap;
