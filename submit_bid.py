import argparse
from config import contract, get_account, format_eth_to_wei, format_timestamp
import sys

def submit_bid(args):
    """Submit a bid for a tender"""
    account = get_account()
    
    # Convert bid amount to wei
    bid_amount = format_eth_to_wei(args.amount)
    
    # Prepare transaction
    tx = contract.functions.submitBid(
        args.tender_id,
        bid_amount,
        args.proposal
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
    
    # Get bid ID from event
    bid_submitted_event = contract.events.BidSubmitted().process_receipt(receipt)[0]
    bid_id = bid_submitted_event.args.bidId
    
    print(f"\nBid submitted successfully!")
    print(f"Tender ID: {args.tender_id}")
    print(f"Bid ID: {bid_id}")
    print(f"Bidder: {account.address}")
    print(f"Amount: {args.amount} ETH")
    print(f"Proposal: {args.proposal}")
    print(f"Transaction Hash: {receipt.transactionHash.hex()}")

def main():
    parser = argparse.ArgumentParser(description='Submit a bid for a tender')
    parser.add_argument('--tender-id', type=int, required=True, help='Tender ID')
    parser.add_argument('--amount', type=float, required=True, help='Bid amount in ETH')
    parser.add_argument('--proposal', required=True, help='Bid proposal text')
    
    args = parser.parse_args()
    
    try:
        submit_bid(args)
    except Exception as e:
        print(f"Error submitting bid: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 