import argparse
from config import contract, format_wei_to_eth, format_timestamp, get_tender_status
import sys
from tabulate import tabulate

def view_tenders(args):
    """View tenders and their bids"""
    # Get total number of tenders
    total_tenders = contract.functions.getTenderCount().call()
    
    if total_tenders == 0:
        print("No tenders found")
        return
    
    # Get tenders with pagination
    tenders = contract.functions.getAllTenders(args.offset, args.limit).call()
    
    # Prepare tender data for display
    tender_data = []
    for i in range(len(tenders[0])):  # Using first array length as all arrays have same length
        tender_data.append([
            tenders[0][i],  # ID
            tenders[1][i],  # Title
            tenders[2][i],  # Owner
            get_tender_status(tenders[3][i]),  # Status
            format_timestamp(tenders[4][i]),  # Deadline
            format_wei_to_eth(tenders[5][i]),  # Min Bid
            tenders[6][i]  # Total Bids
        ])
    
    # Display tenders
    print("\nTenders:")
    print(tabulate(
        tender_data,
        headers=['ID', 'Title', 'Owner', 'Status', 'Deadline', 'Min Bid (ETH)', 'Total Bids'],
        tablefmt='grid'
    ))
    
    # If specific tender ID provided, show its bids
    if args.tender_id is not None:
        try:
            # Get tender details
            tender = contract.functions.getTender(args.tender_id).call()
            
            print(f"\nTender Details (ID: {args.tender_id}):")
            print(f"Title: {tender[0]}")
            print(f"Description: {tender[1]}")
            print(f"Deadline: {format_timestamp(tender[2])}")
            print(f"Minimum Bid: {format_wei_to_eth(tender[3])} ETH")
            print(f"Owner: {tender[4]}")
            print(f"Status: {get_tender_status(tender[5])}")
            print(f"Created At: {format_timestamp(tender[7])}")
            print(f"Private: {'Yes' if tender[9] else 'No'}")
            
            # Get bids for this tender
            total_bids = contract.functions.getTenderBidsCount(args.tender_id).call()
            if total_bids > 0:
                bids = contract.functions.getTenderBids(args.tender_id, 0, total_bids).call()
                
                # Prepare bid data for display
                bid_data = []
                for i in range(len(bids[0])):
                    bid_data.append([
                        bids[0][i],  # ID
                        bids[1][i],  # Bidder
                        format_wei_to_eth(bids[2][i]),  # Amount
                        format_timestamp(bids[3][i]),  # Timestamp
                        bids[4][i]  # Proposal
                    ])
                
                print("\nBids:")
                print(tabulate(
                    bid_data,
                    headers=['ID', 'Bidder', 'Amount (ETH)', 'Timestamp', 'Proposal'],
                    tablefmt='grid'
                ))
            else:
                print("\nNo bids for this tender")
                
        except Exception as e:
            print(f"Error viewing tender details: {str(e)}", file=sys.stderr)

def main():
    parser = argparse.ArgumentParser(description='View tenders and their bids')
    parser.add_argument('--offset', type=int, default=0, help='Offset for pagination')
    parser.add_argument('--limit', type=int, default=10, help='Number of tenders to show')
    parser.add_argument('--tender-id', type=int, help='View specific tender details and bids')
    
    args = parser.parse_args()
    
    try:
        view_tenders(args)
    except Exception as e:
        print(f"Error viewing tenders: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 