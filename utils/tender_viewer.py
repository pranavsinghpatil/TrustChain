from typing import Dict, List, Optional, Tuple
from web3 import Web3
from datetime import datetime
import json

class TenderViewer:
    """Helper class for viewing tender and bid information"""
    
    def __init__(
        self,
        web3_provider: Web3,
        contract_address: str,
        contract_abi: List
    ):
        """Initialize the tender viewer"""
        self.web3 = web3_provider
        self.contract = self.web3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )

    def get_tender(
        self,
        tender_id: int
    ) -> Dict:
        """
        Get detailed information about a specific tender
        
        Args:
            tender_id: ID of the tender
            
        Returns:
            Dict containing tender details
        """
        try:
            tender_info = self.contract.functions.getTender(tender_id).call()
            
            return {
                'title': tender_info[0],
                'description': tender_info[1],
                'deadline': datetime.fromtimestamp(tender_info[2]).isoformat(),
                'min_bid_wei': tender_info[3],
                'min_bid_eth': self.web3.from_wei(tender_info[3], 'ether'),
                'owner': tender_info[4],
                'status': tender_info[5],  # TenderStatus enum value
                'winning_bid_id': tender_info[6],
                'created_at': datetime.fromtimestamp(tender_info[7]).isoformat(),
                'document_hash': tender_info[8].hex(),
                'is_private': tender_info[9],
                'total_bids': tender_info[10]
            }
            
        except Exception as e:
            raise Exception(f"Failed to get tender details: {str(e)}")

    def get_all_tenders(
        self,
        page: int = 1,
        per_page: int = 10
    ) -> Tuple[List[Dict], int]:
        """
        Get a paginated list of all tenders
        
        Args:
            page: Page number (1-based)
            per_page: Number of items per page
            
        Returns:
            Tuple of (tender list, total count)
        """
        try:
            # Calculate offset and limit
            offset = (page - 1) * per_page
            total_count = self.contract.functions.getTenderCount().call()
            
            # Get paginated tender data
            tender_data = self.contract.functions.getAllTenders(
                offset,
                per_page
            ).call()
            
            # Process tender data
            tenders = []
            for i in range(len(tender_data[0])):  # Using ids array length
                tenders.append({
                    'id': tender_data[0][i],
                    'title': tender_data[1][i],
                    'owner': tender_data[2][i],
                    'status': tender_data[3][i],  # TenderStatus enum value
                    'deadline': datetime.fromtimestamp(tender_data[4][i]).isoformat(),
                    'min_bid_wei': tender_data[5][i],
                    'min_bid_eth': self.web3.from_wei(tender_data[5][i], 'ether'),
                    'total_bids': tender_data[6][i]
                })
            
            return tenders, total_count
            
        except Exception as e:
            raise Exception(f"Failed to get tender list: {str(e)}")

    def get_tender_bids(
        self,
        tender_id: int,
        page: int = 1,
        per_page: int = 10
    ) -> Tuple[List[Dict], int]:
        """
        Get a paginated list of bids for a specific tender
        
        Args:
            tender_id: ID of the tender
            page: Page number (1-based)
            per_page: Number of items per page
            
        Returns:
            Tuple of (bid list, total count)
        """
        try:
            # Calculate offset and limit
            offset = (page - 1) * per_page
            total_count = self.contract.functions.getTenderBidsCount(tender_id).call()
            
            # Get paginated bid data
            bid_data = self.contract.functions.getTenderBids(
                tender_id,
                offset,
                per_page
            ).call()
            
            # Process bid data
            bids = []
            for i in range(len(bid_data[0])):  # Using ids array length
                bids.append({
                    'id': bid_data[0][i],
                    'bidder': bid_data[1][i],
                    'amount_wei': bid_data[2][i],
                    'amount_eth': self.web3.from_wei(bid_data[2][i], 'ether'),
                    'timestamp': datetime.fromtimestamp(bid_data[3][i]).isoformat(),
                    'proposal': bid_data[4][i]
                })
            
            return bids, total_count
            
        except Exception as e:
            raise Exception(f"Failed to get tender bids: {str(e)}")

    def get_active_tenders(
        self,
        page: int = 1,
        per_page: int = 10
    ) -> Tuple[List[Dict], int]:
        """
        Get a paginated list of active tenders
        
        Args:
            page: Page number (1-based)
            per_page: Number of items per page
            
        Returns:
            Tuple of (tender list, total count)
        """
        try:
            # Get all tenders
            tenders, total_count = self.get_all_tenders(1, total_count)
            
            # Filter active tenders
            active_tenders = [
                tender for tender in tenders
                if tender['status'] == 0  # TenderStatus.ACTIVE
            ]
            
            # Apply pagination
            start = (page - 1) * per_page
            end = start + per_page
            paginated_tenders = active_tenders[start:end]
            
            return paginated_tenders, len(active_tenders)
            
        except Exception as e:
            raise Exception(f"Failed to get active tenders: {str(e)}")

    def get_closed_tenders(
        self,
        page: int = 1,
        per_page: int = 10
    ) -> Tuple[List[Dict], int]:
        """
        Get a paginated list of closed tenders
        
        Args:
            page: Page number (1-based)
            per_page: Number of items per page
            
        Returns:
            Tuple of (tender list, total count)
        """
        try:
            # Get all tenders
            tenders, total_count = self.get_all_tenders(1, total_count)
            
            # Filter closed tenders
            closed_tenders = [
                tender for tender in tenders
                if tender['status'] == 1  # TenderStatus.CLOSED
            ]
            
            # Apply pagination
            start = (page - 1) * per_page
            end = start + per_page
            paginated_tenders = closed_tenders[start:end]
            
            return paginated_tenders, len(closed_tenders)
            
        except Exception as e:
            raise Exception(f"Failed to get closed tenders: {str(e)}") 