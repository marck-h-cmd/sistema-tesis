import DashboardLayout from '@/app/dashboard/layout';

export default function RevisionConformidadJuradoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}