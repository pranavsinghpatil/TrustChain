import React, { useEffect, useState } from "react";
import { useWeb3 } from "@/contexts/Web3Context";
import { useToast } from "@/hooks/use-toast";
import NavBar from "@/components/layout/NavBar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

interface TenderItem {
  id: number;
  title: string;
  isActive: boolean;
  highestBid: number;
  highestBidder: string;
}

interface EventItem {
  type: string;
  tenderId: number;
  actor: string;
  detail: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const { contract, connectWallet, isConnected, account } = useWeb3();
  const { toast } = useToast();
  const [tenders, setTenders] = useState<TenderItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const init = async () => {
      if (!contract) return;
      if (!isConnected) await connectWallet();
      // fetch tenders and highest bids
      const count = await contract.tenderCount();
      const list: TenderItem[] = [];
      for (let i = 0; i < count.toNumber(); i++) {
        const [id,, title,, , , , isActive] = await contract.getTender(i);
        const bidCount = await contract.getBidsCount(i);
        let highest = 0;
        let bidderAddr = "";
        for (let j = 0; j < bidCount.toNumber(); j++) {
          const [bidder, amount] = await contract.getBid(i, j);
          if (amount.toNumber() > highest) {
            highest = amount.toNumber();
            bidderAddr = bidder;
          }
        }
        list.push({ id: id.toNumber(), title, isActive, highestBid: highest, highestBidder: bidderAddr });
      }
      setTenders(list);
    };
    init();
    // subscribe to events
    if (contract) {
      const addEvent = (type: string, tenderId: number, actor: string, detail: string) => {
        setEvents(prev => [{ type, tenderId, actor, detail, timestamp: new Date().toLocaleString() }, ...prev]);
      };
      contract.on("TenderCreated", (id, creator) => addEvent("Created", id.toNumber(), creator, "Tender created"));
      contract.on("TenderUpdated", (id) => addEvent("Updated", id.toNumber(), account || "", "Tender updated"));
      contract.on("TenderCancelled", (id, by) => addEvent("Cancelled", id.toNumber(), by, "Tender cancelled"));
      contract.on("BidPlaced", (id, bidder, amount) => addEvent("BidPlaced", id.toNumber(), bidder, `Bid ₹${amount.toString()}`));
      contract.on("TenderAwarded", (id, winner) => addEvent("Awarded", id.toNumber(), winner, "Tender awarded"));
      return () => {
        contract.removeAllListeners();
      };
    }
  }, [contract, isConnected]);

  const handleAward = async (t: TenderItem) => {
    if (!contract) return;
    try {
      const tx = await contract.awardTender(t.id, t.highestBidder);
      await tx.wait();
      toast({ title: "Tender Awarded", description: `Tender ${t.id} awarded to ${t.highestBidder}` });
    } catch (err) {
      toast({ title: "Error", description: (err as Error).message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* <NavBar /> */}
      <main className="flex-grow p-8 max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <section>
          <h2 className="text-xl font-semibold mb-2">Recent Events</h2>
          <ul className="space-y-1 text-sm">
            {events.map((e, idx) => (
              <li key={idx} className="border-b pb-1">
                <span className="font-medium">[{e.timestamp}]</span> Tender <b>#{e.tenderId}</b> {e.type} by <span className="font-mono">{e.actor}</span>
              </li>
            ))}
            {events.length === 0 && <li className="text-gray-500">No events yet.</li>}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-semibold mb-2">Open Tenders & Highest Bids</h2>
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">Title</th>
                <th className="p-2 text-left">Highest Bid (₹)</th>
                <th className="p-2 text-left">Bidder</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {tenders.filter(t => t.isActive).map(t => (
                <tr key={t.id} className="border-t">
                  <td className="p-2">{t.id}</td>
                  <td className="p-2">{t.title}</td>
                  <td className="p-2">{t.highestBid.toLocaleString('en-IN')}</td>
                  <td className="p-2 font-mono">{t.highestBidder.slice(0,6)}...{t.highestBidder.slice(-4)}</td>
                  <td className="p-2">
                    <Button size="sm" onClick={() => handleAward(t)} disabled={t.highestBid===0}>
                      Award
                    </Button>
                  </td>
                </tr>
              ))}
              {tenders.filter(t => t.isActive).length === 0 && (
                <tr><td colSpan={5} className="p-4 text-center text-gray-500">No open tenders.</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboard;
