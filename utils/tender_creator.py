from typing import List, Dict, Optional
from datetime import datetime, timedelta
from web3 import Web3
from eth_typing import Address
from pathlib import Path
import json
from .ipfs_handler import IPFSDocumentHandler

class TenderCreator:
    """Helper class for creating tenders with document management"""
    
    def __init__(
        self,
        web3_provider: Web3,
        contract_address: str,
        contract_abi: List,
        ipfs_handler: IPFSDocumentHandler
    ):
        """Initialize the tender creator"""
        self.web3 = web3_provider
        self.contract = self.web3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )
        self.ipfs_handler = ipfs_handler

    def create_tender(
        self,
        title: str,
        description: str,
        deadline_days: int,
        min_bid_eth: float,
        document_paths: List[str],
        is_private: bool = False,
        allowed_bidders: Optional[List[str]] = None,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Create a new tender with documents
        
        Args:
            title: Tender title
            description: Tender description
            deadline_days: Number of days until deadline
            min_bid_eth: Minimum bid in ETH
            document_paths: List of paths to tender documents
            is_private: Whether this is a private tender
            allowed_bidders: List of addresses allowed to bid (for private tenders)
            from_address: Address creating the tender
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing tender ID and IPFS document info
        """
        # Validate inputs
        if not title or not description:
            raise ValueError("Title and description are required")
            
        if deadline_days < 1 or deadline_days > 90:
            raise ValueError("Deadline must be between 1 and 90 days")
            
        if min_bid_eth <= 0:
            raise ValueError("Minimum bid must be greater than 0")
            
        if is_private and not allowed_bidders:
            raise ValueError("Private tenders must specify allowed bidders")
            
        # Upload documents to IPFS
        document_metadata = []
        for doc_path in document_paths:
            metadata = self.ipfs_handler.upload_tender_document(
                0,  # Temporary tender ID, will update after creation
                doc_path,
                Path(doc_path).suffix[1:]  # Use file extension as document type
            )
            document_metadata.append(metadata)
            
        # Create combined IPFS metadata
        combined_metadata = {
            'documents': document_metadata,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Convert metadata to bytes32
        metadata_str = json.dumps(combined_metadata)
        document_hash = self.web3.keccak(text=metadata_str)
        
        # Prepare contract parameters
        deadline_timestamp = int(
            (datetime.utcnow() + timedelta(days=deadline_days)).timestamp()
        )
        min_bid_wei = self.web3.to_wei(min_bid_eth, 'ether')
        
        # Clean and validate bidder addresses
        if allowed_bidders:
            allowed_bidders = [
                addr if isinstance(addr, bytes) else Web3.to_checksum_address(addr)
                for addr in allowed_bidders
            ]
            
        # Create tender transaction
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Create tender
            tx_hash = self.contract.functions.createTender(
                title,
                description,
                deadline_timestamp,
                min_bid_wei,
                document_hash,
                is_private,
                allowed_bidders or []
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get tender ID from event logs
            tender_created_event = self.contract.events.TenderCreated().process_receipt(tx_receipt)[0]
            tender_id = tender_created_event.args.tenderId
            
            # Update document metadata with actual tender ID
            for metadata in document_metadata:
                metadata['tender_id'] = tender_id
                
            return {
                'tender_id': tender_id,
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'document_hash': document_hash.hex(),
                'ipfs_metadata': document_metadata
            }
            
        except Exception as e:
            # Clean up IPFS files if tender creation fails
            for metadata in document_metadata:
                try:
                    self.ipfs_handler.delete_document(metadata['ipfs_hash'])
                except:
                    pass
            raise Exception(f"Failed to create tender: {str(e)}")

    def estimate_gas(
        self,
        title: str,
        description: str,
        deadline_days: int,
        min_bid_eth: float,
        is_private: bool = False,
        allowed_bidders: Optional[List[str]] = None
    ) -> int:
        """Estimate gas cost for creating a tender"""
        deadline_timestamp = int(
            (datetime.utcnow() + timedelta(days=deadline_days)).timestamp()
        )
        min_bid_wei = self.web3.to_wei(min_bid_eth, 'ether')
        document_hash = self.web3.keccak(text="placeholder")
        
        return self.contract.functions.createTender(
            title,
            description,
            deadline_timestamp,
            min_bid_wei,
            document_hash,
            is_private,
            allowed_bidders or []
        ).estimate_gas() 