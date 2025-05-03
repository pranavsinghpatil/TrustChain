const fs = require('fs');
const path = require('path');

// Read the contract addresses from the JSON file
const addressesPath = path.join(__dirname, '..', 'src', 'contracts', 'addresses.json');
const contractsPath = path.join(__dirname, '..', 'src', 'contracts', 'interfaces', 'contracts.ts');

// Check if addresses file exists
if (!fs.existsSync(addressesPath)) {
  console.error('Error: Contract addresses file not found. Please deploy contracts first.');
  process.exit(1);
}

// Read addresses
const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));

// Read the contracts.ts file
let contractsContent = fs.readFileSync(contractsPath, 'utf8');

// Update the contract addresses in the file
contractsContent = contractsContent.replace(
  /export const CONTRACT_ADDRESSES = \{[^}]*\};/s,
  `export const CONTRACT_ADDRESSES = {
  OFFICER_MANAGEMENT: '${addresses.OfficerManagement}',
  USER_AUTHENTICATION: '${addresses.UserAuthentication}',
  TENDER_MANAGEMENT: '${addresses.TenderManagement}',
};`
);

// Write the updated content back to the file
fs.writeFileSync(contractsPath, contractsContent);

console.log('Contract addresses updated in contracts.ts file successfully!');
console.log('Updated addresses:');
console.log('- OfficerManagement:', addresses.OfficerManagement);
console.log('- UserAuthentication:', addresses.UserAuthentication);
console.log('- TenderManagement:', addresses.TenderManagement);
