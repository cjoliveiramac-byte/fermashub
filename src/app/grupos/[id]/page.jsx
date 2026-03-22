import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import GroupClient from "@/components/GroupClient";

export const dynamic = "force-dynamic";

export default function GroupDetailPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 flex-col gap-4">
          <GroupClient />
        </main>
      </div>
    </div>
  );
}
