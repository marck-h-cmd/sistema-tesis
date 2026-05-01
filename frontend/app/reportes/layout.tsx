import DashboardLayout from '@/app/dashboard/layout';

export default function ReportesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}