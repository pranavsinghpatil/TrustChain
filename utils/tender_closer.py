from typing import Dict, Optional, List
from web3 import Web3
from datetime import datetime
import json

class TenderCloser:
    """Helper class for closing tenders and managing winners"""
    
    def __init__(
        self,
        web3_provider: Web3,
        contract_address: str,
        contract_abi: List
    ):
        """Initialize the tender closer"""
        self.web3 = web3_provider
        self.contract = self.web3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )

    def close_tender(
        self,
        tender_id: int,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Close a tender and select the winning bid
        
        Args:
            tender_id: ID of the tender to close
            from_address: Address closing the tender
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing tender closing details
        """
        # Prepare transaction parameters
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Close tender
            tx_hash = self.contract.functions.closeTender(
                tender_id
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get tender closing details from event logs
            tender_closed_event = self.contract.events.TenderClosed().process_receipt(tx_receipt)[0]
            
            return {
                'tender_id': tender_closed_event.args.tenderId,
                'winning_bid_id': tender_closed_event.args.winningBidId,
                'winner': tender_closed_event.args.winner,
                'winning_amount_wei': tender_closed_event.args.winningAmount,
                'winning_amount_eth': self.web3.from_wei(tender_closed_event.args.winningAmount, 'ether'),
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to close tender: {str(e)}")

    def cancel_tender(
        self,
        tender_id: int,
        from_address: str = None,
        gas_limit: int = 3000000
    ) -> Dict:
        """
        Cancel a tender without selecting a winner
        
        Args:
            tender_id: ID of the tender to cancel
            from_address: Address cancelling the tender
            gas_limit: Gas limit for transaction
            
        Returns:
            Dict containing tender cancellation details
        """
        # Prepare transaction parameters
        tx_params = {
            'from': from_address or self.web3.eth.default_account,
            'gas': gas_limit
        }
        
        try:
            # Cancel tender
            tx_hash = self.contract.functions.cancelTender(
                tender_id
            ).transact(tx_params)
            
            # Wait for transaction receipt
            tx_receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
            
            # Get tender cancellation details from event logs
            tender_cancelled_event = self.contract.events.TenderCancelled().process_receipt(tx_receipt)[0]
            
            return {
                'tender_id': tender_cancelled_event.args.tenderId,
                'owner': tender_cancelled_event.args.owner,
                'transaction_hash': tx_receipt.transactionHash.hex(),
                'block_number': tx_receipt.blockNumber,
                'timestamp': datetime.fromtimestamp(
                    self.web3.eth.get_block(tx_receipt.blockNumber).timestamp
                ).isoformat()
            }
            
        except Exception as e:
            raise Exception(f"Failed to cancel tender: {str(e)}")

    def get_tender_status(
        self,
        tender_id: int
    ) -> Dict:
        """
        Get the current status of a tender
        
        Args:
            tender_id: ID of the tender
            
        Returns:
            Dict containing tender status information
        """
        try:
            status_info = self.contract.functions.getTenderStatusInfo(tender_id).call()
            
            return {
                'status': status_info[0],  # TenderStatus enum value
                'winning_bid_id': status_info[1],
                'created_at': datetime.fromtimestamp(status_info[2]).isoformat(),
                'total_bids': status_info[3]
            }
            
        except Exception as e:
            raise Exception(f"Failed to get tender status: {str(e)}")

    def estimate_gas(
        self,
        tender_id: int,
        action: str = 'close'  # 'close' or 'cancel'
    ) -> int:
        """
        Estimate gas cost for closing or cancelling a tender
        
        Args:
            tender_id: ID of the tender
            action: Action to perform ('close' or 'cancel')
            
        Returns:
            Estimated gas cost
        """
        if action == 'close':
            return self.contract.functions.closeTender(tender_id).estimate_gas()
        else:
            return self.contract.functions.cancelTender(tender_id).estimate_gas() 