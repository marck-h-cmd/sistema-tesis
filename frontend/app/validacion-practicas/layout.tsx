import DashboardLayout from '@/app/dashboard/layout';

export default function ValidacionPracticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
