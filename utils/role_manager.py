from typing import Dict, List, Optional
from web3 import Web3
from datetime import datetime
import json

class RoleManager:
    """Helper class for managing roles and permissions"""
    
    def __init__(
        self,
        web3_provider: Web3,
        contract_address: str,
        contract_abi: List
    ):
        """Initialize the role manager"""
        self.web3 = web3_provider
        self.contract = self.web3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )

    def add_admin(
        self,
        admin_address: str,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Add a new admin
        
        Args:
            admin_address: Address to add as admin
            from_address: Address performing the action
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing transaction details
        """
        # Prepare transaction parameters
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Add admin
            tx_hash = self.contract.functions.addAdmin(
                admin_address
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get admin addition details from event logs
            admin_added_event = self.contract.events.AdminAdded().process_receipt(tx_receipt)[0]
            
            return {
                'admin': admin_added_event.args.admin,
                'added_by': admin_added_event.args.addedBy,
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to add admin: {str(e)}")

    def remove_admin(
        self,
        admin_address: str,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Remove an admin
        
        Args:
            admin_address: Address to remove as admin
            from_address: Address performing the action
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing transaction details
        """
        # Prepare transaction parameters
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Remove admin
            tx_hash = self.contract.functions.removeAdmin(
                admin_address
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get admin removal details from event logs
            admin_removed_event = self.contract.events.AdminRemoved().process_receipt(tx_receipt)[0]
            
            return {
                'admin': admin_removed_event.args.admin,
                'removed_by': admin_removed_event.args.removedBy,
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to remove admin: {str(e)}")

    def verify_vendor(
        self,
        vendor_address: str,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Verify a vendor
        
        Args:
            vendor_address: Address to verify as vendor
            from_address: Address performing the action
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing transaction details
        """
        # Prepare transaction parameters
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Verify vendor
            tx_hash = self.contract.functions.verifyVendor(
                vendor_address
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get vendor verification details from event logs
            vendor_verified_event = self.contract.events.VendorVerified().process_receipt(tx_receipt)[0]
            
            return {
                'vendor': vendor_verified_event.args.vendor,
                'timestamp': datetime.fromtimestamp(vendor_verified_event.args.timestamp).isoformat(),
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber
            }
            
        except Exception as e:
            raise Exception(f"Failed to verify vendor: {str(e)}")

    def revoke_vendor(
        self,
        vendor_address: str,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Revoke a vendor's verification
        
        Args:
            vendor_address: Address to revoke as vendor
            from_address: Address performing the action
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing transaction details
        """
        # Prepare transaction parameters
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Revoke vendor
            tx_hash = self.contract.functions.revokeVendor(
                vendor_address
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get vendor revocation details from event logs
            vendor_verified_event = self.contract.events.VendorVerified().process_receipt(tx_receipt)[0]
            
            return {
                'vendor': vendor_verified_event.args.vendor,
                'revoked_at': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat(),
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber
            }
            
        except Exception as e:
            raise Exception(f"Failed to revoke vendor: {str(e)}")

    def is_admin(
        self,
        address: str
    ) -> bool:
        """
        Check if an address is an admin
        
        Args:
            address: Address to check
            
        Returns:
            True if address is an admin, False otherwise
        """
        try:
            return self.contract.functions.isAdmin(address).call()
        except Exception as e:
            raise Exception(f"Failed to check admin status: {str(e)}")

    def is_verified_vendor(
        self,
        address: str
    ) -> bool:
        """
        Check if an address is a verified vendor
        
        Args:
            address: Address to check
            
        Returns:
            True if address is a verified vendor, False otherwise
        """
        try:
            return self.contract.functions.verifiedVendors(address).call()
        except Exception as e:
            raise Exception(f"Failed to check vendor status: {str(e)}") 