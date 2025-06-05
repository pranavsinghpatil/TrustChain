import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import NavBar from "@/components/layout/NavBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Approvals = () => {
  const { users, approveUser, rejectUser } = useAuth();
  const pendingUsers = users.filter(u => u.role === "bidder" && !u.isApproved);

  const [remarks, setRemarks] = useState<Record<string, string>>({});

  return (
    <div className="min-h-screen bg-gray-50/0">
      {/* <NavBar /> */}
      <main className="container pt-20 mx-auto px-4">
        <h1 className="text-2xl font-bold mb-4">User Approvals</h1>
        {pendingUsers.length === 0 ? (
          <p>No users pending approval.</p>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <Card key={user.id}>
                <CardHeader>
                  <CardTitle>
                    {user.name} (@{user.username})
                  </CardTitle>
                  {user.email && <p className="text-sm text-gray-500">{user.email}</p>}
                  {user.approvalRemark && <p className="text-sm text-red-500">Remark: {user.approvalRemark}</p>}
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button onClick={() => approveUser(user.id)} className="bg-green-500 hover:bg-green-600 text-white">
                      Approve
                    </Button>
                    <Button onClick={() => rejectUser(user.id, remarks[user.id] || "Needs more info")} className="bg-red-500 hover:bg-red-600 text-white">
                      Reject
                    </Button>
                  </div>
                  <Input
                    placeholder="Rejection remark"
                    value={remarks[user.id] || ""}
                    onChange={e => setRemarks(prev => ({ ...prev, [user.id]: e.target.value }))}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Approvals;
