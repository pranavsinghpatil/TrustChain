from django.utils import timezone
import os
import base64
import pickle
from Blockchain import Blockchain
from datetime import datetime

def notifications_processor(request):
    """
    Context processor to add notification count to all templates
    """
    # Default empty context
    context = {
        'unread_notification_count': 0
    }
    
    # Get current user
    current_user = ''
    try:
        current_user = request.session.get('username', '')
        if not current_user:
            with open("session.txt", "r") as file:
                for line in file:
                    current_user = line.strip('\n')
                    break
    except:
        return context  # Return empty context if no user
    
    if not current_user:
        return context
        
    # Load blockchain
    blockchain = Blockchain()
    if os.path.exists('blockchain_contract.txt'):
        with open('blockchain_contract.txt', 'rb') as fileinput:
            blockchain = pickle.load(fileinput)
        fileinput.close()
    
    # Get the last time notifications were read
    notifications_read = request.session.get('notifications_read', 0)
    
    # Function to decrypt data
    def decrypt(enc):
        from Block import decrypt
        return decrypt(enc)
    
    # Count unread notifications
    unread_count = 0
    user_bids = {}
    
    # Scan blockchain for bids and notifications
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                # Store user bids
                if arr[0] == "bidding" and arr[3] == current_user:
                    tender_title = arr[1]
                    timestamp = b.timestamp
                    if timestamp > notifications_read:
                        unread_count += 1
                
                # Check winner notifications
                elif arr[0] == "winner":
                    tender_title = arr[1]
                    winner = arr[4]
                    timestamp = b.timestamp
                    if (winner == current_user or tender_title in user_bids) and timestamp > notifications_read:
                        unread_count += 1
            except:
                pass
    
    context['unread_notification_count'] = unread_count
    return context
