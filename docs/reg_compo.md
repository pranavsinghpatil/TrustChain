
 File Upload Functionality
Added a drag-and-drop file upload area for supporting documents
Supports multiple file uploads with progress tracking
Shows file previews with size information
Allows removing uploaded files before submission
File type validation (PDF, DOC, JPG, PNG) with size limit (10MB)
2. Business Profile Section
Added fields for annual turnover
Employee count input
Company website URL
Business description textarea
3. Business References
Dynamic reference section where users can add multiple business references
Each reference includes:
Name
Relationship
Email
Contact number
Option to add/remove references as needed
4. Enhanced Additional Information
Improved the additional information textarea with better placeholder text
Added helper text to guide users on what to include
5. Form Submission
Added proper loading states during submission
File upload progress tracking
Better error handling and user feedback
Form reset after successful submission
Consolidated Tax ID Fields:
Removed separate fields for gstNumber, panNumber, and taxIdentificationNumber
Added a single taxId field that handles all identification numbers
Updated the label and placeholder text to be dynamic based on the selected bidder type
Updated Types:
Modified the RegisterData interface to use a single taxId field
Updated the FormData type to include the new taxId field and exclude the old fields
Added proper type checking for the handleSelectChange function
Form Validation:
Added required validation for the taxId field
Ensured the field shows an error message when left empty
Fixed TypeScript Errors:
Updated the handleSelectChange function to handle the 'state' field
Added "Legal Status" and "Company Category" fields to the company details section
Implemented proper TypeScript types for all form fields
Added validation for the new fields
Fixed TypeScript errors related to form handling
Ensured proper handling of mobile numbers for foreign bidders
Improved error handling and user feedback
The form now includes:

A "Legal Status" dropdown with options: Private Limited, Public Limited, LLP, OPC, and Other
A "Company Category" dropdown with options: Startup, SME, MSME, Large Enterprise, MNC, and Other
Proper validation for all required fields
Type safety throughout the form
Ensured all form fields are properly typed
Set default values for legalStatus and companyCategory to empty strings to show the placeholder text in the select dropdowns.
Updated the LegalStatus and CompanyCategory types to include an empty string as a valid value.
Modified the handleSelectChange function to handle empty string values and ensure type safety.
Added validation in the onSubmit function to ensure that both legalStatus and companyCategory are selected before form submission.
Updated the type assertions in the form submission to ensure type safety.
The form now:

Shows placeholder text in the select dropdowns when no option is selected.
Validates that both fields are selected before allowing form submission.
Provides clear error messages if the required fields are not selected.
Maintains type safety throughout the form.
Bidder Type Handling:
When "Foreign" is selected:
Added a Tax Identification Number field instead of GST/PAN
Changed "State" to "Province/State" with a text input instead of dropdown
Changed "PIN Code" to "Postal Code" with different validation
Modified mobile number validation to accept international formats
Removed Country Code Selector:
Removed the complex country code dropdown component
Eliminated all related state and imports
Updated Mobile Number Input:
Single input field for all mobile numbers
Dynamic placeholder text based on bidder type
Clear validation messages
Improved Validation:
Indian numbers: 10 digits starting with 6-9
International numbers: 8-15 digits with optional leading +
Simplified Form Submission:
Automatically adds + for foreign numbers if missing
Preserves existing + if provided
Removes duplicate + signs if present


 to check the field contents visit - https://etenders.gov.in/eprocure/app?component=%24WebHomeBorder.%24WebRightMenu.%24DirectLink&page=Home&service=direct&session=T

---------------------------------------------------------------------------------------------


@register.md#L1-90 

some mandates to do in register component---
add fields-->
in login credentials 
-1 biddertype 
-2 username 
-3 mobile no.
-4 email
-5 password
-6 confirm password
layout:
==1== ==3== ==5==
==2== ==4== ==6==


in company details
-1 company name
-2 registeration no.
-3 legal status
-4 company category
-5 Establish year 
-6 GST/PAN {if bidder = indian} , TAX id {if bidder = foreigner}

layout:
==1== ==3== ==5==
==2== ==4== ==6==


in Business Profile:
-1 Business Scope – Local, National, or International
-2 Headquarters Location – City, country of the main office
-3 Key Competitors – Major companies in the same industry
-4 Annual Revenue
-5 Employee count input
-6 Company website URL
-7 Business description textarea: {Business Info / Description:

- **International Branches:** [Enter locations if applicable]
- **Export/Import Status:** [Specify involvement in international trade]
- **Foreign Partnerships:** [List collaborations with global businesses]
- **Compliance with International Regulations:** [Mention adherence to standards like GDPR, ISO, etc.]
- **Company Ownership Type:** [Private, Public, Government, Joint Venture]
- **Revenue Model:** [Subscription-based, one-time sales, service-based, etc.]
- **Technology Adoption:** [AI, Blockchain, Cloud Computing, etc.]
- **Customer Demographics:** [B2B, B2C, Enterprise, Government clients]
- **Employee Count & Distribution:** [Specify number and locations]
- **Funding & Investment Details:** [Venture capital, bootstrapped, government-backed]}

layout:
==1== ==2== ==3==
==4== ==5== ==6==
========7========

in  Business References
[Dynamic reference section where users can add multiple business references]
Each reference includes:
-1 Name
-2 Relationship
-3 Email
-4 Contact number
-5 Option to add/remove references as needed


== for 5 i let it be dynamic  you decide how suitable it will be , i leave it on you ==

in additional info
-1 register addres text area
-2 state 
-3 city
-4 pin/zip code
-5 File Upload Functionality:
Added a drag-and-drop file upload area for supporting documents
Supports multiple file uploads with progress tracking
Shows file previews with size information
Allows removing uploaded files before submission
File type validation (PDF, DOC, JPG, PNG) with size limit (10MB)
-6 additional details -[ additional information textarea with better placeholder text
 Added helper text to guide users on what to include]

layout:
=======1=======
==2== ==3== ==4==
=======5=======
=======6=======


modify the registration form 

also the required fields with *
