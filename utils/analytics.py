from typing import List, Dict, Tuple
from collections import defaultdict
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from web3 import Web3

class TenderAnalytics:
    """Analytics dashboard for the tender management system"""
    
    def __init__(self, web3_provider: Web3, contract_address: str, contract_abi: List):
        """Initialize analytics with Web3 connection"""
        self.web3 = web3_provider
        self.contract = self.web3.eth.contract(
            address=contract_address,
            abi=contract_abi
        )
        
    def get_basic_stats(self) -> Dict:
        """Get basic statistics about tenders and bids"""
        tender_count = self.contract.functions.tenderCount().call()
        active_tenders = 0
        total_bids = 0
        
        for i in range(tender_count):
            status_info = self.contract.functions.getTenderStatusInfo(i).call()
            if status_info[0] == 0:  # ACTIVE status
                active_tenders += 1
            total_bids += self.contract.functions.getTenderBidsCount(i).call()
            
        return {
            'total_tenders': tender_count,
            'active_tenders': active_tenders,
            'total_bids': total_bids,
            'avg_bids_per_tender': total_bids / tender_count if tender_count > 0 else 0
        }
        
    def get_top_vendors(self, limit: int = 3) -> List[Dict]:
        """Get top vendors based on winning bids"""
        tender_count = self.contract.functions.tenderCount().call()
        vendor_stats = defaultdict(lambda: {'wins': 0, 'total_bids': 0})
        
        # Collect vendor statistics
        for i in range(tender_count):
            status_info = self.contract.functions.getTenderStatusInfo(i).call()
            bids_count = self.contract.functions.getTenderBidsCount(i).call()
            
            # Count all bids
            for j in range(bids_count):
                bid = self.contract.functions.getBidDetails(i, j).call()
                vendor_stats[bid[1]]['total_bids'] += 1
                
            # Count wins
            if status_info[0] == 1:  # CLOSED status
                winning_bid = self.contract.functions.getBidDetails(i, status_info[1]).call()
                vendor_stats[winning_bid[1]]['wins'] += 1
        
        # Convert to list and sort by wins
        vendors = [
            {
                'address': addr,
                'wins': stats['wins'],
                'total_bids': stats['total_bids'],
                'win_rate': stats['wins'] / stats['total_bids'] if stats['total_bids'] > 0 else 0
            }
            for addr, stats in vendor_stats.items()
        ]
        
        return sorted(vendors, key=lambda x: x['wins'], reverse=True)[:limit]
        
    def get_tender_timeline(self, days: int = 30) -> List[Dict]:
        """Get tender creation timeline for the last N days"""
        tender_count = self.contract.functions.tenderCount().call()
        now = datetime.utcnow()
        timeline = defaultdict(int)
        
        for i in range(tender_count):
            basic_info = self.contract.functions.getTenderBasicInfo(i).call()
            status_info = self.contract.functions.getTenderStatusInfo(i).call()
            created_at = datetime.fromtimestamp(status_info[2])
            
            if (now - created_at).days <= days:
                date_key = created_at.date().isoformat()
                timeline[date_key] += 1
                
        # Fill in missing dates
        all_dates = [
            (now - timedelta(days=x)).date().isoformat()
            for x in range(days)
        ]
        
        return [
            {'date': date, 'count': timeline.get(date, 0)}
            for date in all_dates
        ]
        
    def get_bid_price_analysis(self) -> Dict:
        """Analyze bid prices across all tenders"""
        tender_count = self.contract.functions.tenderCount().call()
        all_bids = []
        
        for i in range(tender_count):
            bids_count = self.contract.functions.getTenderBidsCount(i).call()
            for j in range(bids_count):
                bid = self.contract.functions.getBidDetails(i, j).call()
                all_bids.append(float(Web3.from_wei(bid[2], 'ether')))
                
        if not all_bids:
            return {
                'avg_bid': 0,
                'median_bid': 0,
                'min_bid': 0,
                'max_bid': 0
            }
            
        return {
            'avg_bid': np.mean(all_bids),
            'median_bid': np.median(all_bids),
            'min_bid': min(all_bids),
            'max_bid': max(all_bids)
        }
        
    def export_tender_report(self, output_path: str) -> None:
        """Export tender data to Excel report"""
        tender_count = self.contract.functions.tenderCount().call()
        tender_data = []
        
        for i in range(tender_count):
            basic_info = self.contract.functions.getTenderBasicInfo(i).call()
            status_info = self.contract.functions.getTenderStatusInfo(i).call()
            
            tender_data.append({
                'ID': basic_info[0],
                'Title': basic_info[1],
                'Description': basic_info[2],
                'Deadline': datetime.fromtimestamp(basic_info[3]),
                'Min Bid': Web3.from_wei(basic_info[4], 'ether'),
                'Owner': basic_info[5],
                'Status': ['ACTIVE', 'CLOSED', 'CANCELLED'][status_info[0]],
                'Created At': datetime.fromtimestamp(status_info[2]),
                'Total Bids': status_info[3]
            })
            
        df = pd.DataFrame(tender_data)
        df.to_excel(output_path, index=False) 