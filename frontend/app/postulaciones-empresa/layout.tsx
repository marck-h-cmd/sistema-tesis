import DashboardLayout from '@/app/dashboard/layout';

export default function PostulacionesEmpresaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}