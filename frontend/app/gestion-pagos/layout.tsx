import DashboardLayout from '@/app/dashboard/layout';

export default function SecretariaGestionPagosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
