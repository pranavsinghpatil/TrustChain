import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useWeb3 } from "@/contexts/Web3Context";
import { Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout";

const BidderRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { connectWallet, isConnected, account } = useWeb3();
  
  // Form state
  const [bidderType, setBidderType] = useState<string>("Indian");
  const [formData, setFormData] = useState({
    // Login Credentials
    username: "",
    email: "",
    mobileNumber: "",
    password: "",
    confirmPassword: "",
    
    // Company Details
    companyName: "",
    registrationNumber: "",
    gstNumber: "",
    panNumber: "",
    establishmentYear: "",
    
    // Additional Details
    registeredOfficeAddress: "",
    state: "",
    city: "",
    pinCode: "",
    additionalInfo: "",
    
    // Agreements
    declarationChecked: false,
    termsChecked: false
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [walletConnected, setWalletConnected] = useState(isConnected);
  
  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      await connectWallet();
      setWalletConnected(true);
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully.",
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name === "bidderType") {
      setBidderType(value);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData({
      ...formData,
      [name]: checked,
    });
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.declarationChecked || !formData.termsChecked) {
      toast({
        title: "Agreement Required",
        description: "Please agree to the declaration and terms & conditions.",
        variant: "destructive",
      });
      return;
    }
    
    if (!walletConnected) {
      toast({
        title: "Wallet Connection Required",
        description: "Please connect your wallet to complete registration.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // TODO: Implement registration logic with blockchain
      
      toast({
        title: "Registration Submitted",
        description: "Your registration has been submitted for review by an officer.",
      });
      
      // Redirect to login page after successful registration
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "Failed to register. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="bg-opacity-80 backdrop-blur-sm border border-gray-300">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-2">
              <div className="bg-primary p-3 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">TrustChain</CardTitle>
            <CardDescription>Blockchain-based tender management system</CardDescription>
          </CardHeader>
          
          <div className="flex justify-center mb-4 space-x-4">
            <Button variant="outline" className="w-48" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button variant="default" className="w-48">
              Register
            </Button>
          </div>
          
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {/* Login Credentials Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary">Login Credentials</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bidderType">Bidder Type*</Label>
                    <Select 
                      value={bidderType} 
                      onValueChange={(value) => handleSelectChange("bidderType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select bidder type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Indian">Indian</SelectItem>
                        <SelectItem value="Foreign">Foreign</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="username">Username*</Label>
                    <Input
                      id="username"
                      name="username"
                      placeholder="Choose a unique username"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address*</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">Mobile Number*</Label>
                    <Input
                      id="mobileNumber"
                      name="mobileNumber"
                      placeholder={bidderType === "Indian" ? "Enter 10-digit mobile number" : "Enter mobile with country code"}
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2 relative">
                    <Label htmlFor="password">Password*</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter a strong password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 relative">
                    <Label htmlFor="confirmPassword">Confirm Password*</Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Company Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary">Company Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name*</Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      placeholder="Enter your company name"
                      value={formData.companyName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registrationNumber">Registration Number*</Label>
                    <Input
                      id="registrationNumber"
                      name="registrationNumber"
                      placeholder="Company registration number"
                      value={formData.registrationNumber}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  {bidderType === "Indian" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="gstNumber">GST Number</Label>
                        <Input
                          id="gstNumber"
                          name="gstNumber"
                          placeholder="Enter GST number"
                          value={formData.gstNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="panNumber">PAN Number*</Label>
                        <Input
                          id="panNumber"
                          name="panNumber"
                          placeholder="Enter PAN number"
                          value={formData.panNumber}
                          onChange={handleInputChange}
                          required={bidderType === "Indian"}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="establishmentYear">Establishment Year*</Label>
                    <Input
                      id="establishmentYear"
                      name="establishmentYear"
                      placeholder="YYYY"
                      value={formData.establishmentYear}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                
                {/* Additional Details Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-primary">Additional Details</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registeredOfficeAddress">Registered Office Address*</Label>
                    <Textarea
                      id="registeredOfficeAddress"
                      name="registeredOfficeAddress"
                      placeholder="Enter complete registered address"
                      value={formData.registeredOfficeAddress}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State*</Label>
                    <Input
                      id="state"
                      name="state"
                      placeholder="Enter state name"
                      value={formData.state}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">City*</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Enter city name"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pinCode">PIN Code*</Label>
                    <Input
                      id="pinCode"
                      name="pinCode"
                      placeholder="Enter 6-digit PIN code"
                      value={formData.pinCode}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="additionalInfo">Additional Information (Optional)</Label>
                    <Textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      placeholder="Any additional details you would like to provide"
                      value={formData.additionalInfo}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              
              {/* Wallet Connection Section */}
              <div className="mb-6">
                <div className="flex items-center p-4 border rounded-md bg-gray-50">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-primary">Wallet Connection</h3>
                    <p className="text-sm text-gray-500">
                      Connect your Ethereum wallet to complete registration
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleConnectWallet}
                    disabled={walletConnected}
                    variant={walletConnected ? "outline" : "default"}
                  >
                    {walletConnected ? "Wallet Connected" : "Connect Wallet"}
                  </Button>
                </div>
                {walletConnected && (
                  <p className="text-sm text-green-600 mt-2">
                    Connected: {account?.substring(0, 6)}...{account?.substring(account.length - 4)}
                  </p>
                )}
              </div>
              
              {/* Agreements Section */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="declarationChecked"
                    checked={formData.declarationChecked}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("declarationChecked", checked as boolean)
                    }
                  />
                  <label
                    htmlFor="declarationChecked"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I hereby declare that all the information given above is true and correct to the best of my knowledge.
                  </label>
                </div>
                
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="termsChecked"
                    checked={formData.termsChecked}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("termsChecked", checked as boolean)
                    }
                  />
                  <label
                    htmlFor="termsChecked"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the <a href="#" className="text-primary hover:underline">Terms & Conditions</a> and our <a href="#" className="text-primary hover:underline">Privacy Policy</a>.
                  </label>
                </div>
              </div>
              
              {/* Submit Button */}
              <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600">
                Submit Registration
              </Button>
              
              <p className="text-xs text-center mt-4 text-gray-500">
                All fields marked with * are required. Your application will be reviewed by an officer before activation.
                <br />
                Powered by TrustChain
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default BidderRegistration;
