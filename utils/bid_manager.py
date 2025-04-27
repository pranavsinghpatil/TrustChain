from typing import Dict, Optional, List
from web3 import Web3
from datetime import datetime
import json

class BidManager:
    """Helper class for managing bids on tenders"""
    
    def __init__(
        self,
        web3_provider: Web3,
        contract_address: str,
        contract_abi: List
    ):
        """Initialize the bid manager"""
        self.web3 = web3_provider
        self.contract = self.web3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )

    def submit_bid(
        self,
        tender_id: int,
        bid_amount_eth: float,
        proposal: str,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Submit a bid on a tender
        
        Args:
            tender_id: ID of the tender to bid on
            bid_amount_eth: Bid amount in ETH
            proposal: Bid proposal text
            from_address: Address submitting the bid
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing bid details and transaction info
        """
        # Convert ETH to Wei
        bid_amount_wei = self.web3.to_wei(bid_amount_eth, 'ether')
        
        # Prepare transaction parameters
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Submit bid
            tx_hash = self.contract.functions.submitBid(
                tender_id,
                bid_amount_wei,
                proposal
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get bid details from event logs
            bid_submitted_event = self.contract.events.BidSubmitted().process_receipt(tx_receipt)[0]
            
            return {
                'bid_id': bid_submitted_event.args.bidId,
                'tender_id': bid_submitted_event.args.tenderId,
                'bidder': bid_submitted_event.args.bidder,
                'amount_wei': bid_submitted_event.args.amount,
                'amount_eth': self.web3.from_wei(bid_submitted_event.args.amount, 'ether'),
                'proposal': bid_submitted_event.args.proposal,
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to submit bid: {str(e)}")

    def get_bid_details(
        self,
        tender_id: int,
        bid_index: int
    ) -> Dict:
        """
        Get details of a specific bid
        
        Args:
            tender_id: ID of the tender
            bid_index: Index of the bid in the tender's bid array
            
        Returns:
            Dict containing bid details
        """
        try:
            bid_info = self.contract.functions.getBidDetails(
                tender_id,
                bid_index
            ).call()
            
            return {
                'bid_id': bid_info[0],
                'tender_id': bid_info[1],
                'bidder': bid_info[2],
                'amount_wei': bid_info[3],
                'amount_eth': self.web3.from_wei(bid_info[3], 'ether'),
                'timestamp': datetime.fromtimestamp(bid_info[4]).isoformat(),
                'proposal': bid_info[5]
            }
            
        except Exception as e:
            raise Exception(f"Failed to get bid details: {str(e)}")

    def get_tender_bids_count(
        self,
        tender_id: int
    ) -> int:
        """
        Get the number of bids on a tender
        
        Args:
            tender_id: ID of the tender
            
        Returns:
            Number of bids
        """
        try:
            return self.contract.functions.getTenderBidsCount(tender_id).call()
        except Exception as e:
            raise Exception(f"Failed to get tender bids count: {str(e)}")

    def estimate_gas(
        self,
        tender_id: int,
        bid_amount_eth: float,
        proposal: str
    ) -> int:
        """
        Estimate gas cost for submitting a bid
        
        Args:
            tender_id: ID of the tender
            bid_amount_eth: Bid amount in ETH
            proposal: Bid proposal text
            
        Returns:
            Estimated gas cost
        """
        bid_amount_wei = self.web3.to_wei(bid_amount_eth, 'ether')
        
        return self.contract.functions.submitBid(
            tender_id,
            bid_amount_wei,
            proposal
        ).estimate_gas() 