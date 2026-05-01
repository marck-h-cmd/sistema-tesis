import DashboardLayout from '@/app/dashboard/layout';

export default function EmpresasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}