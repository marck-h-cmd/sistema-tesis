import DashboardLayout from '@/app/dashboard/layout';

export default function PracticasLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}