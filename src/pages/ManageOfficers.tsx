import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWeb3 } from "@/contexts/Web3Context";
import { User } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus, 
  Wallet, 
  Check, 
  X, 
  MoreHorizontal,
  Mail,
  Key,
  Calendar,
  User as UserIcon
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const ManageOfficers: React.FC = () => {
  const { users, createOfficer, removeOfficer, authState, updateUsers } = useAuth();
  const { connectWallet, account, isConnected, isLoading, isCorrectNetwork, officerContract, tenderContract, userAuthContract } = useWeb3();
  const { toast } = useToast();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [selectedOfficer, setSelectedOfficer] = useState<User | null>(null);
  
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [targetOfficerId, setTargetOfficerId] = useState<string | null>(null);
  
  const [contractsReady, setContractsReady] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  
  const officers = users.filter(user => user.role === "officer");
  
  useEffect(() => {
    const ready = isConnected && isCorrectNetwork && !!account && officerContract && tenderContract && userAuthContract;
    setContractsReady(ready);
    if (ready) {
      // Optionally, do a health check on contracts
      (async () => {
        try {
          // Try a simple call to each contract
          await officerContract.admin?.();
          await tenderContract.getAllTenderIds?.();
          await userAuthContract.isAdmin?.(account);
          setContractError(null);
        } catch (err: any) {
          setContractError('Smart contract not found or not initialized. Please redeploy contracts and refresh.');
        }
      })();
    } else {
      setContractError(null);
    }
  }, [isConnected, isCorrectNetwork, account, officerContract, tenderContract, userAuthContract]);
  
  const handleAddOfficer = () => {
    if (!name || !username || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Check if username already exists
    if (users.some(user => user.username === username)) {
      toast({
        title: "Username Taken",
        description: "This username is already in use",
        variant: "destructive",
      });
      return;
    }
    
    createOfficer(name, username, password, email);
    
    // Reset form
    setName("");
    setUsername("");
    setPassword("");
    setEmail("");
    setIsAddDialogOpen(false);
    
    toast({
      title: "Officer Added",
      description: `${name} has been added as a tender officer`,
    });
  };
  
  const handleConnectWallet = async () => {
    if (!targetOfficerId) return;
    
    try {
      setIsConnecting(true);
      const success = await connectWallet();
      
      if (success && account) {
        // Update the officer's wallet address in the context
        const officer = users.find(u => u.id === targetOfficerId);
        if (officer) {
          toast({
            title: "Wallet Connected",
            description: `Wallet connected to ${officer.name}'s account`,
          });
        }
      } else {
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast({
        title: "Connection Error",
        description: "An error occurred while connecting the wallet",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
      setIsWalletDialogOpen(false);
      setTargetOfficerId(null);
    }
  };
  
  const handleRemoveOfficer = () => {
    if (selectedOfficer) {
      removeOfficer(selectedOfficer.id);
      setIsDeleteDialogOpen(false);
      setSelectedOfficer(null);
    }
  };
  
  const handleEditOfficer = () => {
    if (!selectedOfficer || !editName || !editUsername) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the new username already exists (and it's not the current officer's username)
    if (editUsername !== selectedOfficer.username && 
        users.some(user => user.username === editUsername)) {
      toast({
        title: "Username Taken",
        description: "This username is already in use",
        variant: "destructive",
      });
      return;
    }
    
    // Update the officer in the users array
    const updatedUsers = users.map(user => {
      if (user.id === selectedOfficer.id) {
        return {
          ...user,
          name: editName,
          username: editUsername,
          email: editEmail || user.email,
        };
      }
      return user;
    });
    
    // Update the users state in the auth context
    updateUsers(updatedUsers);
    
    setIsEditDialogOpen(false);
    setSelectedOfficer(null);
    
    toast({
      title: "Officer Updated",
      description: `${editName}'s information has been updated`,
    });
  };
  
  const openEditDialog = (officer: User) => {
    setSelectedOfficer(officer);
    setEditName(officer.name);
    setEditUsername(officer.username);
    setEditEmail(officer.email || "");
    setIsEditDialogOpen(true);
  };
  
  const openDetailsDialog = (officer: User) => {
    setSelectedOfficer(officer);
    setIsDetailsDialogOpen(true);
  };
  
  const openDeleteDialog = (officer: User) => {
    setSelectedOfficer(officer);
    setIsDeleteDialogOpen(true);
  };
  
  const openWalletDialog = (officerId: string) => {
    setTargetOfficerId(officerId);
    setIsWalletDialogOpen(true);
  };
  
  if (!contractsReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-white mb-4">Please connect your wallet, select the correct network, and ensure contracts are deployed.</p>
          <Button onClick={connectWallet} disabled={isLoading} className="mb-2">{isLoading ? 'Connecting...' : 'Connect Wallet'}</Button>
        </div>
      </div>
    );
  }
  
  if (contractError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-400 mb-4">{contractError}</p>
          <Button onClick={() => window.location.reload()} className="mb-2">Reload</Button>
        </div>
      </div>
    );
  }
  
  if (authState.user?.role !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-[#1B1B1B]/40 backdrop-blur-xl border border-white/10">
          <CardHeader>
            <CardTitle className="text-red-500">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to access this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <Card className="bg-[#1B1B1B]/40 backdrop-blur-xl border border-white/10">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold text-green-400">Manage Tender Officers</CardTitle>
              <CardDescription>
                Appoint and manage tender officers for your organization
              </CardDescription>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Officer
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active">Active Officers</TabsTrigger>
              <TabsTrigger value="all">All Officers</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active">
              {officers.filter(officer => officer.isApproved).length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <UserIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No active officers found</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    Add Your First Officer
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {officers
                      .filter(officer => officer.isApproved)
                      .map((officer) => (
                        <TableRow key={officer.id}>
                          <TableCell className="font-medium">{officer.name}</TableCell>
                          <TableCell>{officer.username}</TableCell>
                          <TableCell>{officer.email || "-"}</TableCell>
                          <TableCell>{officer.createdAt.toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Active
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openDetailsDialog(officer)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditDialog(officer)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openWalletDialog(officer.id)}>
                                  <Wallet className="mr-2 h-4 w-4" />
                                  Connect Wallet
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(officer)}
                                  className="text-red-500 focus:text-red-500"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="all">
              {officers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <UserIcon className="mx-auto h-12 w-12 opacity-20 mb-2" />
                  <p>No officers found</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    Add Your First Officer
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {officers.map((officer) => (
                      <TableRow key={officer.id}>
                        <TableCell className="font-medium">{officer.name}</TableCell>
                        <TableCell>{officer.username}</TableCell>
                        <TableCell>{officer.email || "-"}</TableCell>
                        <TableCell>{officer.createdAt.toLocaleDateString()}</TableCell>
                        <TableCell>
                          {officer.isApproved ? (
                            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => openDetailsDialog(officer)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(officer)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openWalletDialog(officer.id)}>
                                <Wallet className="mr-2 h-4 w-4" />
                                Connect Wallet
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => openDeleteDialog(officer)}
                                className="text-red-500 focus:text-red-500"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Add Officer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1B1B1B] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-green-400">Add New Officer</DialogTitle>
            <DialogDescription>
              Create a new tender officer account
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name*
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3 bg-transparent border-gray-700"
                placeholder="Officer's full name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right">
                Username*
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3 bg-transparent border-gray-700"
                placeholder="Login username"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right">
                Password*
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="col-span-3 bg-transparent border-gray-700"
                placeholder="Secure password"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="col-span-3 bg-transparent border-gray-700"
                placeholder="officer@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddOfficer} className="bg-green-500 hover:bg-green-600">
              Create Officer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Connect Wallet Dialog */}
      <Dialog open={isWalletDialogOpen} onOpenChange={setIsWalletDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1B1B1B] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Connect Wallet</DialogTitle>
            <DialogDescription>
              Connect a blockchain wallet to this officer account
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex flex-col items-center justify-center">
            {isConnected ? (
              <div className="text-center">
                <Check className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-green-400 font-medium">Wallet Connected!</p>
                <p className="text-sm text-gray-400 mt-2 font-mono">
                  {account?.slice(0, 8)}...{account?.slice(-6)}
                </p>
              </div>
            ) : (
              <Button
                onClick={handleConnectWallet}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                {isConnecting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect Metamask Wallet
                  </>
                )}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWalletDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Officer Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-[#1B1B1B] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-green-400">Officer Details</DialogTitle>
            <DialogDescription>
              Detailed information about this tender officer
            </DialogDescription>
          </DialogHeader>
          {selectedOfficer && (
            <div className="py-4">
              <div className="bg-[#2A2A2A] rounded-lg p-4 mb-4">
                <div className="flex items-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-500/20 flex items-center justify-center mr-4">
                    <UserIcon className="h-8 w-8 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-white">{selectedOfficer.name}</h3>
                    <p className="text-gray-400">Tender Officer</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-400 mr-2">Username:</span>
                    <span className="font-medium">{selectedOfficer.username}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-400 mr-2">Email:</span>
                    <span className="font-medium">{selectedOfficer.email || "Not provided"}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-400 mr-2">Created:</span>
                    <span className="font-medium">{selectedOfficer.createdAt.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <Key className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-400 mr-2">Status:</span>
                    {selectedOfficer.isApproved ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                        Pending
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <Wallet className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-400 mr-2">Wallet:</span>
                    <span className="font-medium font-mono">
                      {selectedOfficer.walletAddress 
                        ? `${selectedOfficer.walletAddress.slice(0, 8)}...${selectedOfficer.walletAddress.slice(-6)}`
                        : "Not connected"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    openEditDialog(selectedOfficer);
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant="outline"
                  className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
                  onClick={() => {
                    setIsDetailsDialogOpen(false);
                    openWalletDialog(selectedOfficer.id);
                  }}
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Officer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1B1B1B] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-blue-400">Edit Officer</DialogTitle>
            <DialogDescription>
              Update officer account information
            </DialogDescription>
          </DialogHeader>
          {selectedOfficer && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-name" className="text-right">
                  Name*
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="col-span-3 bg-transparent border-gray-700"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-username" className="text-right">
                  Username*
                </Label>
                <Input
                  id="edit-username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="col-span-3 bg-transparent border-gray-700"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-email" className="text-right">
                  Email
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="col-span-3 bg-transparent border-gray-700"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditOfficer} className="bg-blue-500 hover:bg-blue-600">
              Update Officer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-[#1B1B1B] border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-red-400">Remove Officer</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this officer?
            </DialogDescription>
          </DialogHeader>
          {selectedOfficer && (
            <div className="py-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
                <p className="text-white">
                  You are about to remove <span className="font-medium">{selectedOfficer.name}</span> ({selectedOfficer.username}).
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  This action cannot be undone. The officer will lose all access to the system.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRemoveOfficer} 
              variant="destructive"
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove Officer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManageOfficers;
