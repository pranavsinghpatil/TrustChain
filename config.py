import os
from web3 import Web3
from dotenv import load_dotenv
import json

# Load environment variables
load_dotenv()

# Contract configuration
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
PRIVATE_KEY = os.getenv('PRIVATE_KEY')
RPC_URL = os.getenv('RPC_URL', 'http://localhost:8545')

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(RPC_URL))

# Load contract ABI
with open('build/contracts/TenderManager.json', 'r') as f:
    contract_data = json.load(f)
    CONTRACT_ABI = contract_data['abi']

# Initialize contract
contract = w3.eth.contract(
    address=CONTRACT_ADDRESS,
    abi=CONTRACT_ABI
)

def get_account():
    """Get the account from private key"""
    if not PRIVATE_KEY:
        raise ValueError("PRIVATE_KEY not set in environment variables")
    return w3.eth.account.from_key(PRIVATE_KEY)

def get_tender_status(status_code):
    """Convert tender status code to human-readable string"""
    status_map = {
        0: "ACTIVE",
        1: "CLOSED",
        2: "CANCELLED"
    }
    return status_map.get(status_code, "UNKNOWN")

def format_timestamp(timestamp):
    """Format Unix timestamp to readable date"""
    from datetime import datetime
    return datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

def format_wei_to_eth(wei):
    """Convert wei to ETH"""
    return w3.from_wei(wei, 'ether')

def format_eth_to_wei(eth):
    """Convert ETH to wei"""
    return w3.to_wei(eth, 'ether') 