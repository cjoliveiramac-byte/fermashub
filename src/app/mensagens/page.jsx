import SidebarLeft from "@/components/SidebarLeft";
import Topbar from "@/components/Topbar";
import MessagesClient from "@/components/MessagesClient";

export default function MensagensPage() {
  return (
    <div className="min-h-screen bg-transparent">
      <Topbar />
      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-8">
        <SidebarLeft />
        <main className="flex flex-1 flex-col gap-4">
          <h1 className="text-xl font-semibold">Mensagens</h1>
          <MessagesClient />
        </main>
      </div>
    </div>
  );
}
