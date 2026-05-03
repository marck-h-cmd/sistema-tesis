import DashboardLayout from '@/app/dashboard/layout';

export default function MisPostulacionesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}