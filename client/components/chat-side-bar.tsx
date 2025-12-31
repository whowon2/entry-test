"use client";

import { authClient } from "@/lib/auth-client";
import { PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Ticket = {
  id: string;
  department: string | null;
  status: "OPEN" | "TRANSFERRED" | "CLOSED";
  createdAt: string;
};

interface ChatSidebarProps {
  onSelectTicket: (ticketId: string | null) => void;
  currentTicketId: string | null;
}
export function ChatSideBar({
  onSelectTicket,
  currentTicketId,
}: ChatSidebarProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      // Fetch user's ticket history
      // Note: You need to create this GET route in your backend or use your Drizzle queries
      fetch("http://localhost:3001/api/tickets", {
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setTickets(data))
        .catch((err) => console.error("Failed to load history", err));
    }
  }, [session]);

  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 h-screen flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <button
          onClick={() => onSelectTicket(null)}
          className="w-full flex items-center justify-center gap-2 bg-black text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
        >
          <PlusCircle size={18} />
          New Support Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            onClick={() => onSelectTicket(ticket.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              currentTicketId === ticket.id
                ? "bg-white border-blue-500 shadow-sm"
                : "bg-transparent border-transparent hover:bg-gray-100"
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  ticket.status === "TRANSFERRED"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {ticket.status}
              </span>
              <span className="text-[10px] text-gray-400">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-700 truncate">
              {ticket.department || "General Support"}
            </p>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
            {session?.user?.name?.charAt(0) || "U"}
          </div>
          <div className="text-sm">
            <p className="font-medium">{session?.user?.name}</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
