import DashboardLayout from '@/app/dashboard/layout';

export default function AsignarAsesorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}