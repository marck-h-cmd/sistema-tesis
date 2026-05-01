import DashboardLayout from '@/app/dashboard/layout';

export default function TesisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}