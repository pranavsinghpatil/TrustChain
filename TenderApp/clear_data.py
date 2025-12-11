import base64
import pickle
import os
import sys
import datetime

# Add parent directory to path to import Blockchain module
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from Blockchain import Blockchain

# Import encryption/decryption functions from views.py
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

# We need to provide simple implementations in case the imports fail
def dummy_decrypt(enc):
    return enc

def dummy_encrypt(plaintext):
    return plaintext

# Try to import the real functions
try:
    # This might fail if the dependencies aren't available
    import pyaes
    import pbkdf2
    
    def getKey():
        password = "s3cr3t*c0d3"
        passwordSalt = '76895'
        key = pbkdf2.PBKDF2(password, passwordSalt).read(32)
        return key
    
    def encrypt(plaintext):
        aes = pyaes.AESModeOfOperationCTR(getKey(), pyaes.Counter(31129547035000047302952433967654195398124239844566322884172163637846056248223))
        ciphertext = aes.encrypt(plaintext)
        return ciphertext
    
    def decrypt(enc):
        aes = pyaes.AESModeOfOperationCTR(getKey(), pyaes.Counter(31129547035000047302952433967654195398124239844566322884172163637846056248223))
        decrypted = aes.decrypt(enc)
        return decrypted
        
except ImportError:
    print("Warning: Could not import encryption libraries. Using dummy functions instead.")
    # Use the dummy functions if the real ones aren't available
    encrypt = dummy_encrypt
    decrypt = dummy_decrypt

def clear_tender_data():
    print("Starting data cleanup process...")
    
    # Load the original blockchain
    original_blockchain = None
    if os.path.exists('blockchain_contract.txt'):
        with open('blockchain_contract.txt', 'rb') as fileinput:
            original_blockchain = pickle.load(fileinput)
        fileinput.close()
    else:
        print("No blockchain data found!")
        return False
    
    # Create a new blockchain with only the genesis block
    new_blockchain = Blockchain()
    
    # Keep track of accounts found
    accounts = []
    
    print(f"Original blockchain length: {len(original_blockchain.chain)}")
    print("Scanning for account records...")
    
    # Counter for blocks processed
    processed = 0
    
    # Go through each block and only keep signup records
    for i in range(len(original_blockchain.chain)):
        if i == 0:
            # This is the genesis block, already in the new blockchain
            continue
            
        try:
            b = original_blockchain.chain[i]
            data = b.transactions[0]
            data = base64.b64decode(data)
            data = str(decrypt(data))
            data = data[2:len(data)-1]
            arr = data.split("#")
            
            if arr[0] == "signup":
                # This is a signup record, add it to the new blockchain
                username = arr[1]
                accounts.append(username)
                
                # Add this transaction to the new blockchain
                enc = encrypt(str(data))
                enc = str(base64.b64encode(enc), 'utf-8')
                new_blockchain.add_new_transaction(enc)
                hash = new_blockchain.mine()
                processed += 1
                
                print(f"Preserved account: {username}")
        except Exception as e:
            print(f"Error processing block {i}: {str(e)}")
            continue
    
    # Save the new blockchain
    print(f"Saving new blockchain with {len(accounts)} accounts ({processed} blocks)...")
    new_blockchain.save_object(new_blockchain, 'blockchain_contract.txt')
    print("Data cleanup complete!")
    print(f"Accounts preserved: {accounts}")
    
    return True

if __name__ == "__main__":
    clear_tender_data()
