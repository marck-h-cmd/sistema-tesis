import DashboardLayout from '@/app/dashboard/layout';

export default function EstudiantesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}