"use client";

import { ChatArea } from "@/components/chat";
import { ChatSideBar } from "@/components/chat-side-bar";
import { useState } from "react";

export default function Page() {
  const [currentTicketId, setCurrentTicketId] = useState<string | null>(null);

  // When a user selects a chat from the sidebar
  const handleSelectTicket = (id: string | null) => {
    setCurrentTicketId(id);
  };

  // When a new chat (null ID) gets its first real ID from the backend
  const handleTicketCreated = (newId: string) => {
    setCurrentTicketId(newId);
    // You might want to trigger a refresh on the sidebar here to show the new item
    // A simple way is to pass a "refreshTrigger" prop to Sidebar
  };

  return (
    <div className="flex h-screen w-full overflow-hidden font-sans text-gray-900">
      <ChatSideBar
        onSelectTicket={handleSelectTicket}
        currentTicketId={currentTicketId}
      />
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <ChatArea
          ticketId={currentTicketId}
          onTicketCreated={handleTicketCreated}
        />
      </main>
    </div>
  );
}
