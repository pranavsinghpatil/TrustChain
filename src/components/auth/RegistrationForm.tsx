import React from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { RegisterData } from "@/types/auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const RegistrationForm: React.FC = () => {
  const { register: ctxRegister, authState } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData>();
  const onSubmit: SubmitHandler<RegisterData> = async data => {
    const success = await ctxRegister(data);
    if (success) navigate("/");
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Bidder Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Basic Info */}
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...register("username", { required: true })} />
            {errors.username && <p className="text-xs text-red-500">Username is required</p>}
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input type="password" id="password" {...register("password", { required: true, minLength: 6 })} />
            {errors.password && <p className="text-xs text-red-500">Password (min 6 chars) is required</p>}
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" {...register("email", { required: true })} />
            {errors.email && <p className="text-xs text-red-500">Email is required</p>}
          </div>
          <div>
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input id="mobileNumber" {...register("mobileNumber", { required: true })} />
            {errors.mobileNumber && <p className="text-xs text-red-500">Mobile number is required</p>}
          </div>

          {/* Company Details */}
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" {...register("companyName", { required: true })} />
            {errors.companyName && <p className="text-xs text-red-500">Company name is required</p>}
          </div>
          <div>
            <Label htmlFor="registrationNumber">Registration Number</Label>
            <Input id="registrationNumber" {...register("registrationNumber", { required: true })} />
            {errors.registrationNumber && <p className="text-xs text-red-500">Registration number is required</p>}
          </div>
          <div>
            <Label htmlFor="registeredAddress">Registered Address</Label>
            <Input id="registeredAddress" {...register("registeredAddress", { required: true })} />
            {errors.registeredAddress && <p className="text-xs text-red-500">Address is required</p>}
          </div>
          <div>
            <Label htmlFor="partnersDirectors">Partners/Directors</Label>
            <Input id="partnersDirectors" {...register("partnersDirectors", { required: true })} />
            {errors.partnersDirectors && <p className="text-xs text-red-500">This field is required</p>}
          </div>
          <div>
            <Label htmlFor="bidderType">Bidder Type</Label>
            <select id="bidderType" className="w-full border rounded px-2 py-1" {...register("bidderType", { required: true })}>
              <option value="Indian">Indian</option>
              <option value="Foreign">Foreign</option>
            </select>
            {errors.bidderType && <p className="text-xs text-red-500">Select a type</p>}
          </div>
          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city", { required: true })} />
            {errors.city && <p className="text-xs text-red-500">City is required</p>}
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register("state", { required: true })} />
            {errors.state && <p className="text-xs text-red-500">State is required</p>}
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" {...register("country", { required: true })} />
            {errors.country && <p className="text-xs text-red-500">Country is required</p>}
          </div>
          <div>
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input id="postalCode" {...register("postalCode", { required: true })} />
            {errors.postalCode && <p className="text-xs text-red-500">Postal code is required</p>}
          </div>
          <div>
            <Label htmlFor="panNumber">PAN Number</Label>
            <Input id="panNumber" {...register("panNumber", { required: true })} />
            {errors.panNumber && <p className="text-xs text-red-500">PAN number is required</p>}
          </div>
          <div>
            <Label htmlFor="establishmentYear">Establishment Year</Label>
            <Input id="establishmentYear" {...register("establishmentYear", { required: true })} />
            {errors.establishmentYear && <p className="text-xs text-red-500">Year is required</p>}
          </div>
          <div>
            <Label htmlFor="natureOfBusiness">Nature of Business</Label>
            <Input id="natureOfBusiness" {...register("natureOfBusiness", { required: true })} />
            {errors.natureOfBusiness && <p className="text-xs text-red-500">This field is required</p>}
          </div>
          <div>
            <Label htmlFor="legalStatus">Legal Status</Label>
            <Input id="legalStatus" {...register("legalStatus", { required: true })} />
            {errors.legalStatus && <p className="text-xs text-red-500">This field is required</p>}
          </div>
          <div>
            <Label htmlFor="companyCategory">Company Category</Label>
            <Input id="companyCategory" {...register("companyCategory", { required: true })} />
            {errors.companyCategory && <p className="text-xs text-red-500">This field is required</p>}
          </div>

          {/* Contact Person */}
          <div>
            <Label htmlFor="contactPersonName">Contact Person Name</Label>
            <Input id="contactPersonName" {...register("contactPersonName", { required: true })} />
            {errors.contactPersonName && <p className="text-xs text-red-500">Required</p>}
          </div>
          <div>
            <Label htmlFor="contactPersonTitle">Contact Person Title</Label>
            <Input id="contactPersonTitle" {...register("contactPersonTitle", { required: true })} />
            {errors.contactPersonTitle && <p className="text-xs text-red-500">Required</p>}
          </div>
          <div>
            <Label htmlFor="contactDesignation">Designation</Label>
            <Input id="contactDesignation" {...register("contactDesignation", { required: true })} />
            {errors.contactDesignation && <p className="text-xs text-red-500">Required</p>}
          </div>
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input id="phoneNumber" {...register("phoneNumber", { required: true })} />
            {errors.phoneNumber && <p className="text-xs text-red-500">Required</p>}
          </div>
          <div>
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input type="date" id="dateOfBirth" {...register("dateOfBirth", { required: true })} />
            {errors.dateOfBirth && <p className="text-xs text-red-500">Required</p>}
          </div>
          <div>
            <Label htmlFor="dscCertificate">DSC Certificate (upload file)</Label>
            <Input type="file" id="dscCertificate" {...register("dscCertificate", { required: true })} />
            {errors.dscCertificate && <p className="text-xs text-red-500">Please upload DSC</p>}
          </div>

          <Button type="submit" className="w-full bg-blockchain-blue text-white hover:bg-blockchain-purple" disabled={authState.isLoading}>
            {authState.isLoading ? "Creating account..." : "Submit Registration"}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-gray-500">Officer review required before activation.</p>
      </CardFooter>
    </Card>
  );
};

export default RegistrationForm;
