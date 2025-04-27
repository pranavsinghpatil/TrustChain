from typing import Dict, List, Optional
from web3 import Web3
from datetime import datetime
import json

class PrivateTenderManager:
    """Helper class for managing private tender access control"""
    
    def __init__(
        self,
        web3_provider: Web3,
        contract_address: str,
        contract_abi: List
    ):
        """Initialize the private tender manager"""
        self.web3 = web3_provider
        self.contract = self.web3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )

    def approve_vendor(
        self,
        tender_id: int,
        vendor_address: str,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Approve a vendor for a private tender
        
        Args:
            tender_id: ID of the tender
            vendor_address: Address to approve
            from_address: Address performing the action
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing transaction details
        """
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            tx_hash = self.contract.functions.approveVendor(
                tender_id,
                vendor_address
            ).transact(tx_params)
            
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            vendor_approved_event = self.contract.events.VendorApproved().process_receipt(tx_receipt)[0]
            
            return {
                'tender_id': vendor_approved_event.args.tenderId,
                'vendor': vendor_approved_event.args.vendor,
                'approved_by': vendor_approved_event.args.approvedBy,
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to approve vendor: {str(e)}")

    def bulk_approve_vendors(
        self,
        tender_id: int,
        vendor_addresses: List[str],
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Approve multiple vendors for a private tender
        
        Args:
            tender_id: ID of the tender
            vendor_addresses: List of addresses to approve
            from_address: Address performing the action
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing transaction details
        """
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            tx_hash = self.contract.functions.bulkApproveVendors(
                tender_id,
                vendor_addresses
            ).transact(tx_params)
            
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Process all VendorApproved events
            events = self.contract.events.VendorApproved().process_receipt(tx_receipt)
            
            return {
                'tender_id': tender_id,
                'approved_vendors': [
                    {
                        'vendor': event.args.vendor,
                        'approved_by': event.args.approvedBy
                    } for event in events
                ],
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to bulk approve vendors: {str(e)}")

    def revoke_vendor(
        self,
        tender_id: int,
        vendor_address: str,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Revoke a vendor's access to a private tender
        
        Args:
            tender_id: ID of the tender
            vendor_address: Address to revoke
            from_address: Address performing the action
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing transaction details
        """
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            tx_hash = self.contract.functions.revokeVendor(
                tender_id,
                vendor_address
            ).transact(tx_params)
            
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            vendor_revoked_event = self.contract.events.VendorRevoked().process_receipt(tx_receipt)[0]
            
            return {
                'tender_id': vendor_revoked_event.args.tenderId,
                'vendor': vendor_revoked_event.args.vendor,
                'revoked_by': vendor_revoked_event.args.revokedBy,
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to revoke vendor: {str(e)}")

    def get_approved_vendors(
        self,
        tender_id: int
    ) -> List[str]:
        """
        Get list of approved vendors for a private tender
        
        Args:
            tender_id: ID of the tender
            
        Returns:
            List of approved vendor addresses
        """
        try:
            return self.contract.functions.getApprovedVendors(tender_id).call()
        except Exception as e:
            raise Exception(f"Failed to get approved vendors: {str(e)}")

    def is_vendor_approved(
        self,
        tender_id: int,
        vendor_address: str
    ) -> bool:
        """
        Check if a vendor is approved for a private tender
        
        Args:
            tender_id: ID of the tender
            vendor_address: Address to check
            
        Returns:
            True if vendor is approved, False otherwise
        """
        try:
            approved_vendors = self.get_approved_vendors(tender_id)
            return vendor_address in approved_vendors
        except Exception as e:
            raise Exception(f"Failed to check vendor approval: {str(e)}") 