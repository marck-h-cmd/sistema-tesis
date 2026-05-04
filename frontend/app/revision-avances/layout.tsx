import DashboardLayout from '@/app/dashboard/layout';

export default function AvancesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}