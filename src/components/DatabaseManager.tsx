import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useWeb3 } from "@/contexts/Web3Context";
import { ethers } from "ethers";

export function DatabaseManager() {
  const { provider, signer, account } = useWeb3();
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [tenderTitle, setTenderTitle] = useState('');
  const [tenderDescription, setTenderDescription] = useState('');
  const [tenderBudget, setTenderBudget] = useState('');
  const [tenderDeadline, setTenderDeadline] = useState('');
  const [tenders, setTenders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const roles = ['ADMIN', 'OFFICER', 'BIDDER'];

  useEffect(() => {
    if (signer) {
      loadTenders();
    }
  }, [signer]);

  const loadTenders = async () => {
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_DATABASE_ADDRESS!,
        Database.abi,
        signer
      );
      
      const activeTenders = await contract.getActiveTenders();
      setTenders(activeTenders);
    } catch (error) {
      console.error('Error loading tenders:', error);
    }
  };

  const registerUser = async () => {
    if (!signer || !role || !name || !username || !email) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_DATABASE_ADDRESS!,
        Database.abi,
        signer
      );

      const roleNum = roles.indexOf(role);
      const tx = await contract.registerUser(
        name,
        username,
        email,
        roleNum
      );
      await tx.wait();
      alert('User registered successfully!');
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const createTender = async () => {
    if (!signer || !tenderTitle || !tenderDescription || !tenderBudget || !tenderDeadline) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const contract = new ethers.Contract(
        process.env.NEXT_PUBLIC_DATABASE_ADDRESS!,
        Database.abi,
        signer
      );

      const deadline = Math.floor(new Date(tenderDeadline).getTime() / 1000);
      const tx = await contract.createTender(
        tenderTitle,
        tenderDescription,
        ethers.utils.parseEther(tenderBudget),
        deadline
      );
      await tx.wait();
      alert('Tender created successfully!');
      loadTenders();
    } catch (error) {
      console.error('Tender creation error:', error);
      alert('Failed to create tender. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Registration Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Registration</CardTitle>
          <CardDescription>Register new users to the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={registerUser} disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register User'}
          </Button>
        </CardFooter>
      </Card>

      {/* Tender Management Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tender Management</CardTitle>
          <CardDescription>Create and view tenders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tenderTitle">Tender Title</Label>
              <Input
                id="tenderTitle"
                value={tenderTitle}
                onChange={(e) => setTenderTitle(e.target.value)}
                placeholder="Enter tender title"
              />
            </div>
            <div>
              <Label htmlFor="tenderDescription">Description</Label>
              <Input
                id="tenderDescription"
                value={tenderDescription}
                onChange={(e) => setTenderDescription(e.target.value)}
                placeholder="Enter tender description"
              />
            </div>
            <div>
              <Label htmlFor="tenderBudget">Budget (LTM)</Label>
              <Input
                id="tenderBudget"
                type="number"
                value={tenderBudget}
                onChange={(e) => setTenderBudget(e.target.value)}
                placeholder="Enter budget"
              />
            </div>
            <div>
              <Label htmlFor="tenderDeadline">Deadline</Label>
              <Input
                id="tenderDeadline"
                type="datetime-local"
                value={tenderDeadline}
                onChange={(e) => setTenderDeadline(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={createTender} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Tender'}
          </Button>
        </CardFooter>
      </Card>

      {/* Active Tenders List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Tenders</CardTitle>
          <CardDescription>View all active tenders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tenders.map((tender) => (
              <div key={tender.id} className="p-4 border rounded-lg">
                <h3 className="font-semibold">{tender.title}</h3>
                <p className="text-sm text-muted-foreground">{tender.description}</p>
                <div className="mt-2 space-y-1">
                  <p>Created by: {tender.officerAddress}</p>
                  <p>Budget: {ethers.utils.formatEther(tender.budget)} LTM</p>
                  <p>Deadline: {new Date(tender.deadline * 1000).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
