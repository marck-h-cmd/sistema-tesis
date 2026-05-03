'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Briefcase,
  GraduationCap,
  Users,
  Building2,
  FileText,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'coordinador', 'asesor'] },
  { href: '/practicas', label: 'Prácticas', icon: Briefcase, roles: ['admin', 'coordinador', 'asesor', 'estudiante', 'empresa'] },
  { href: '/tesis', label: 'Tesis', icon: GraduationCap, roles: ['admin', 'coordinador', 'asesor', 'estudiante'] },
  { href: '/mis-postulaciones', label: 'Mis Postulaciones', icon: Briefcase, roles: ['estudiante'] },
  { href: '/estudiantes', label: 'Estudiantes', icon: Users, roles: ['admin', 'coordinador', 'asesor'] },
  { href: '/empresas', label: 'Empresas', icon: Building2, roles: ['admin', 'coordinador', 'estudiante'] },
  { href: '/reportes', label: 'Reportes', icon: FileText, roles: ['admin', 'coordinador'] },
];

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.some((role) => hasRole(role))
  );

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar móvil: fixed. Desktop: relativo en el flex */}
      <aside
        className={cn(
          // móvil: fixed, fuera de pantalla por defecto
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // desktop: posición estática dentro del flex container, siempre visible
          'lg:relative lg:translate-x-0 lg:flex lg:flex-col lg:shrink-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-bold text-lg">Sistema UNT</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="lg:hidden"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {filteredMenu.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => { if (isOpen) onToggle(); }}
                      className={cn(
                        'flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer usuario */}
          <div className="border-t p-4 shrink-0">
            <div className="mb-3">
              <p className="text-sm font-medium truncate">{user?.nombres} {user?.apellidos}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}