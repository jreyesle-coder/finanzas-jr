import { requerirSesion } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  await requerirSesion();
  return (
    <>
      <main className="mx-auto w-full max-w-lg flex-1 px-4 pt-5 pb-28">{children}</main>
      <BottomNav />
    </>
  );
}
