import argparse
from config import contract, get_account, format_eth_to_wei, format_timestamp
from datetime import datetime, timedelta
import sys

def create_tender(args):
    """Create a new tender"""
    account = get_account()
    
    # Convert deadline to timestamp
    deadline = int((datetime.now() + timedelta(days=args.days)).timestamp())
    
    # Convert min bid to wei
    min_bid = format_eth_to_wei(args.min_bid)
    
    # Prepare transaction
    tx = contract.functions.createTender(
        args.title,
        args.description,
        deadline,
        min_bid,
        args.document_hash,
        args.private,
        args.allowed_bidders if args.private else []
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
    
    # Get tender ID from event
    tender_created_event = contract.events.TenderCreated().process_receipt(receipt)[0]
    tender_id = tender_created_event.args.tenderId
    
    print(f"\nTender created successfully!")
    print(f"Tender ID: {tender_id}")
    print(f"Title: {args.title}")
    print(f"Description: {args.description}")
    print(f"Deadline: {format_timestamp(deadline)}")
    print(f"Minimum Bid: {args.min_bid} ETH")
    print(f"Private: {'Yes' if args.private else 'No'}")
    if args.private:
        print(f"Allowed Bidders: {', '.join(args.allowed_bidders)}")
    print(f"Transaction Hash: {receipt.transactionHash.hex()}")

def main():
    parser = argparse.ArgumentParser(description='Create a new tender')
    parser.add_argument('--title', required=True, help='Tender title')
    parser.add_argument('--description', required=True, help='Tender description')
    parser.add_argument('--days', type=int, default=7, help='Number of days until deadline')
    parser.add_argument('--min-bid', type=float, required=True, help='Minimum bid amount in ETH')
    parser.add_argument('--document-hash', default='0x0000000000000000000000000000000000000000000000000000000000000000',
                      help='IPFS document hash (default: empty hash)')
    parser.add_argument('--private', action='store_true', help='Make tender private')
    parser.add_argument('--allowed-bidders', nargs='*', default=[],
                      help='List of allowed bidder addresses (for private tenders)')
    
    args = parser.parse_args()
    
    try:
        create_tender(args)
    except Exception as e:
        print(f"Error creating tender: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main() 