import argparse
from config import contract, get_account, format_wei_to_eth, format_timestamp, get_tender_status
import sys

def close_tender(args):
    """Close a tender and select the winner"""
    account = get_account()
    
    # Prepare transaction
    tx = contract.functions.closeTender(
        args.tender_id
    ).build_transaction({
        'from': account.address,
        'nonce': contract.w3.eth.get_transaction_count(account.address),
        'gas': 3000000
    })
    
    # Sign and send transaction
    signed_tx = contract.w3.eth.account.sign_transaction(tx, account.key)
    tx_hash = contract.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
    
    # Wait for transaction receipt
    receipt = contract.w3.eth.wait_for_transaction_receipt(tx_hash)
    
    # Get tender details
    tender = contract.functions.getTender(args.tender_id).call()
    
    # Get winning bid details
    winning_bid_id = tender[6]  # winningBidId
    if winning_bid_id > 0:
        bids = contract.functions.getTenderBids(args.tender_id, 0, 1).call()
        winning_bid = {
            'id': bids[0][0],
            'bidder': bids[0][1],
            'amount': format_wei_to_eth(bids[0][2]),
            'timestamp': format_timestamp(bids[0][3]),
            'proposal': bids[0][4]
        }
    else:
        winning_bid = None
    
    print(f"\nTender closed successfully!")
    print(f"Tender ID: {args.tender_id}")
    print(f"Title: {tender[0]}")
    print(f"Status: {get_tender_status(tender[5])}")
    if winning_bid:
        print("\nWinning Bid:")
        print(f"Bid ID: {winning_bid['id']}")
        print(f"Winner: {winning_bid['bidder']}")
        print(f"Amount: {winning_bid['amount']} ETH")
        print(f"Proposal: {winning_bid['proposal']}")
    else:
        print("\nNo winning bid selected")
    print(f"Transaction Hash: {receipt.transactionHash.hex()}")

def main():
    parser = argparse.ArgumentParser(description='Close a tender and select the winner')
    parser.add_argument('--tender-id', type=int, required=True, help='Tender ID')
    
    args = parser.parse_args()
    
    try:
        close_tender(args)
    except Exception as e:
        print(f"Error closing tender: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 