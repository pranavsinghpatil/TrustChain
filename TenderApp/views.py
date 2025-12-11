from django.shortcuts import render, redirect
from django.template import RequestContext
import base64
from datetime import datetime
import time
import json
from django.http import HttpResponse
from django.core.files.storage import FileSystemStorage
import os
from Blockchain import *
import datetime

# Initialize blockchain cache properly
if '_blockchain_cache' not in globals() or not isinstance(_blockchain_cache, dict):
    _blockchain_cache = {
        'user_notifications': {},  # Cache notification counts by user
        'tender_data': {},        # Cache tender data
        'bid_data': {},           # Cache bid data 
        'last_chain_length': 0,   # Track chain length to detect changes
        'last_update': None,      # Timestamp of last update
        'cache_hits': 0,          # Performance metrics
        'cache_misses': 0
    }
else:
    # Ensure all required keys exist to prevent KeyError
    if 'user_notifications' not in _blockchain_cache:
        _blockchain_cache['user_notifications'] = {}
    if 'tender_data' not in _blockchain_cache:
        _blockchain_cache['tender_data'] = {}
    if 'bid_data' not in _blockchain_cache:
        _blockchain_cache['bid_data'] = {}
    if 'last_chain_length' not in _blockchain_cache:
        _blockchain_cache['last_chain_length'] = 0
    if 'last_update' not in _blockchain_cache:
        _blockchain_cache['last_update'] = None
    if 'cache_hits' not in _blockchain_cache:
        _blockchain_cache['cache_hits'] = 0
    if 'cache_misses' not in _blockchain_cache:
        _blockchain_cache['cache_misses'] = 0

# Initialize blockchain
blockchain = Blockchain()
if os.path.exists('blockchain_contract.txt'):
    with open('blockchain_contract.txt', 'rb') as fileinput:
        blockchain = pickle.load(fileinput)
    fileinput.close()

# Cache storage for blockchain data to improve performance
_blockchain_cache = {
    'user_notifications': {},  # Cache notification counts by user
    'tender_data': {},        # Cache tender data
    'bid_data': {},           # Cache bid data
    'last_chain_length': 0,   # Track chain length to detect changes
    'last_update': None,      # Timestamp of last cache update
    'cache_hits': 0,          # Performance metrics
    'cache_misses': 0
}

def TenderScreen(request):
    if request.method == 'GET':
        return render(request, 'TenderScreen.html', {})

# Helper functions for cache management
def should_update_cache():
    """Determine if cache needs updating by checking blockchain length"""
    global _blockchain_cache
    current_length = len(blockchain.chain)
    
    # If chain length changed or cache is older than 30 seconds, update cache
    current_time = datetime.datetime.now()
    needs_update = (
        current_length != _blockchain_cache['last_chain_length'] or
        _blockchain_cache['last_update'] is None or
        (current_time - _blockchain_cache['last_update']).total_seconds() > 30
    )
    
    if needs_update:
        _blockchain_cache['last_chain_length'] = current_length
        _blockchain_cache['last_update'] = current_time
    
    return needs_update
    
# Helper functions for notifications and user management
def get_current_user():
    """Retrieve current user from session file"""
    current_user = ''
    try:
        with open("session.txt", "r") as file:
            for line in file:
                current_user = line.strip('\n')
        file.close()
    except Exception:
        pass
    return current_user

def update_notification_cache():
    """Update the notification cache with data from blockchain"""
    global _blockchain_cache
    
    # Reset notification counts
    _blockchain_cache['user_notifications'] = {}
    
    # Scan blockchain for all notifications
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                # Check if this is a notification
                if arr[0] == "notification" and len(arr) >= 5:
                    username = arr[4]  # User the notification is for
                    is_unread = arr[-1] == "unread"
                    
                    # Initialize user in cache if not present
                    if username not in _blockchain_cache['user_notifications']:
                        _blockchain_cache['user_notifications'][username] = 0
                    
                    # Increment unread count if notification is unread
                    if is_unread:
                        _blockchain_cache['user_notifications'][username] += 1
            except Exception:
                pass

def get_unread_notifications_count(username):
    """Get count of unread notifications for a user using cache when possible"""
    global _blockchain_cache
    
    if not username:
        return 0
    
    # Update cache if needed
    if should_update_cache():
        update_notification_cache()
    
    # Return cached count or 0 if user not in cache
    return _blockchain_cache['user_notifications'].get(username, 0)

def BidderNotifications(request):
    """Notification page for bidders to view their notifications"""
    if request.method == 'GET':
        # Get current user from session
        current_user = get_current_user()
        
        # Process mark as read if requested
        notification_id = request.GET.get('mark_read', '')
        if notification_id:
            # Mark notification as read
            try:
                notification_id = int(notification_id)
                for i in range(len(blockchain.chain)):
                    if i > 0 and i == notification_id:
                        b = blockchain.chain[i]
                        data = b.transactions[0]
                        data = base64.b64decode(data)
                        data = str(decrypt(data))
                        data = data[2:len(data)-1]
                        arr = data.split("#")
                        
                        if arr[0] == "notification" and arr[-1] == "unread" and arr[4] == current_user:
                            # Replace with read version
                            new_data = data.replace("#unread", "#read")
                            new_data = new_data.encode()
                            new_data = base64.b64encode(encrypt(new_data))
                            transaction = new_data.decode("utf-8")
                            blockchain.add_block(Block(len(blockchain.chain), str(datetime.datetime.now()), transaction, ""))
                            break
            except Exception as e:
                print(f"Error marking notification as read: {str(e)}")
                pass
                
        # Collect all notifications from blockchain
        edit_approvals = []
        edit_rejections = []
        other_notifications = []
        
        # Count unread notifications
        unread_count = 0
        
        # Scan blockchain for bidder notifications
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    if arr[0] == "notification" and len(arr) >= 5 and arr[4] == current_user:
                        # This notification is for the current user
                        notification_type = arr[1]
                        # Check if notification is unread
                        is_unread = arr[-1] == "unread"
                        
                        if is_unread:
                            unread_count += 1
                        
                        if notification_type == "approve_edit":
                            # Format: notification#approve_edit#tender_title#timestamp#bidder_name#unread/read
                            edit_approvals.append({
                                'id': i,
                                'tender': arr[2],
                                'timestamp': arr[3],
                                'unread': is_unread
                            })
                        elif notification_type == "reject_edit":
                            # Format: notification#reject_edit#tender_title#timestamp#bidder_name#unread/read
                            edit_rejections.append({
                                'id': i,
                                'tender': arr[2],
                                'timestamp': arr[3],
                                'unread': is_unread
                            })
                        # Can add more notification types in the future
                except Exception as e:
                    print(f"Error processing bidder notification: {str(e)}")
                    pass
        
        # Render the notifications template
        context = {
            'edit_approvals': edit_approvals,
            'edit_rejections': edit_rejections,
            'other_notifications': other_notifications,
            'unread_count': unread_count
        }
        return render(request, 'BidderNotifications.html', context)

# Cache storage for blockchain data to improve performance
_blockchain_cache = {
    'user_notifications': {},  # Cache notification counts by user
    'tender_data': {},        # Cache tender data
    'bid_data': {},           # Cache bid data
    'last_chain_length': 0,   # Track chain length to detect changes
    'last_update': None       # Timestamp of last cache update
}

# Helper functions for notifications and user management
def get_current_user():
    """Retrieve current user from session file"""
    current_user = ''
    try:
        with open("session.txt", "r") as file:
            for line in file:
                current_user = line.strip('\n')
        file.close()
    except Exception:
        pass
    return current_user

def should_update_cache():
    """Determine if cache needs updating by checking blockchain length"""
    global _blockchain_cache
    current_length = len(blockchain.chain)
    
    # If chain length changed or cache is older than 30 seconds, update cache
    current_time = datetime.datetime.now()
    needs_update = (
        current_length != _blockchain_cache['last_chain_length'] or
        _blockchain_cache['last_update'] is None or
        (current_time - _blockchain_cache['last_update']).total_seconds() > 30
    )
    
    if needs_update:
        _blockchain_cache['last_chain_length'] = current_length
        _blockchain_cache['last_update'] = current_time
    
    return needs_update

def update_notification_cache():
    """Update the notification cache with data from blockchain"""
    global _blockchain_cache
    
    # Reset notification counts
    _blockchain_cache['user_notifications'] = {}
    
    # Scan blockchain for all notifications
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                # Check if this is a notification
                if arr[0] == "notification" and len(arr) >= 5:
                    username = arr[4]  # User the notification is for
                    is_unread = arr[-1] == "unread"
                    
                    # Initialize user in cache if not present
                    if username not in _blockchain_cache['user_notifications']:
                        _blockchain_cache['user_notifications'][username] = 0
                    
                    # Increment unread count if notification is unread
                    if is_unread:
                        _blockchain_cache['user_notifications'][username] += 1
            except Exception:
                pass

def get_unread_notifications_count(username):
    """Get count of unread notifications for a user using cache when possible"""
    global _blockchain_cache
    
    if not username:
        return 0
    
    # Update cache if needed
    if should_update_cache():
        update_notification_cache()
    
    # Return cached count or 0 if user not in cache
    return _blockchain_cache['user_notifications'].get(username, 0)

def BidderScreen(request):
    if request.method == 'GET':
        # Get unread notification count for navbar badge
        unread_count = get_unread_notifications_count(get_current_user())
        return render(request, 'BidderScreen.html', {'unread_notification_count': unread_count})

from django.contrib import messages
from django.http import HttpResponse
from django.core.files.storage import FileSystemStorage
import os
from Blockchain import *
import datetime

# Initialize blockchain
blockchain = Blockchain()
if os.path.exists('blockchain_contract.txt'):
    with open('blockchain_contract.txt', 'rb') as fileinput:
        blockchain = pickle.load(fileinput)
    fileinput.close()

# Cache storage for blockchain data to improve performance
_blockchain_cache = {
    'user_notifications': {},  # Cache notification counts by user
    'tender_data': {},        # Cache tender data
    'bid_data': {},           # Cache bid data
    'last_chain_length': 0,   # Track chain length to detect changes
    'last_update': None       # Timestamp of last cache update
}

def getKey(): #generating key with PBKDF2 for AES
    password = "s3cr3t*c0d3"
    passwordSalt = '76895'
    key = pbkdf2.PBKDF2(password, passwordSalt).read(32)
    return key

def encrypt(plaintext): #AES data encryption
    aes = pyaes.AESModeOfOperationCTR(getKey(), pyaes.Counter(31129547035000047302952433967654195398124239844566322884172163637846056248223))
    ciphertext = aes.encrypt(plaintext)
    return ciphertext

def decrypt(enc): #AES data decryption
    aes = pyaes.AESModeOfOperationCTR(getKey(), pyaes.Counter(31129547035000047302952433967654195398124239844566322884172163637846056248223))
    decrypted = aes.decrypt(enc)
    return decrypted
        

def CreateTender(request):
    if request.method == 'GET':
       return render(request, 'CreateTender.html', {})

def OfficerNotifications(request):
    """Notification page for tender officers to view unread notifications and bid edit requests"""
    if request.method == 'GET':
        # Collect all notifications from blockchain
        notifications = []
        edit_requests = []
        new_tenders = []
        new_bids = []
        
        # First, process notification read status if requested
        notification_id = request.GET.get('mark_read', '')
        if notification_id:
            # Mark notification as read
            try:
                notification_id = int(notification_id)
                for i in range(len(blockchain.chain)):
                    if i > 0 and i == notification_id:
                        b = blockchain.chain[i]
                        data = b.transactions[0]
                        data = base64.b64decode(data)
                        data = str(decrypt(data))
                        data = data[2:len(data)-1]
                        arr = data.split("#")
                        
                        if arr[0] == "notification" and arr[-1] == "unread":
                            # Replace with read version
                            new_data = data.replace("#unread", "#read")
                            new_data = new_data.encode()
                            new_data = base64.b64encode(encrypt(new_data))
                            transaction = new_data.decode("utf-8")
                            blockchain.add_block(Block(len(blockchain.chain), str(datetime.datetime.now()), transaction, ""))
                            break
            except:
                pass
        
        # Process bid edit action if requested
        action = request.GET.get('action', '')
        tender_title = request.GET.get('tender', '')
        bidder = request.GET.get('bidder', '')
        
        if action and tender_title and bidder:
            if action in ['approve', 'reject']:
                # Create edit approval/rejection record
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                edit_response = f"edit_approval#{tender_title}#{bidder}#{action}#{timestamp}"
                edit_response = edit_response.encode()
                edit_response = base64.b64encode(encrypt(edit_response))
                transaction = edit_response.decode("utf-8")
                blockchain.add_block(Block(len(blockchain.chain), str(datetime.datetime.now()), transaction, ""))
                
                # Create notification for bidder
                notification = f"notification#{action}_edit#{tender_title}#{timestamp}#{bidder}#unread"
                notification = notification.encode()
                notification = base64.b64encode(encrypt(notification))
                transaction = notification.decode("utf-8")
                blockchain.add_block(Block(len(blockchain.chain), str(datetime.datetime.now()), transaction, ""))
                
                messages.success(request, f"Bid edit request {action}d successfully.")
                return redirect('OfficerNotifications')
        
        # Count unread notifications
        unread_count = 0
        
        # Scan blockchain for notifications
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    if arr[0] == "notification":
                        notification_type = arr[1]
                        # Check if notification is unread
                        is_unread = arr[-1] == "unread"
                        
                        if is_unread:
                            unread_count += 1
                        
                        if notification_type == "edit_request":
                            # Format: notification#edit_request#tender_title#bidder_name#timestamp#unread/read
                            edit_requests.append({
                                'id': i,
                                'tender': arr[2],
                                'bidder': arr[3],
                                'timestamp': arr[4],
                                'unread': is_unread
                            })
                        elif notification_type == "new_tender":
                            # Format: notification#new_tender#tender_title#timestamp#unread/read
                            new_tenders.append({
                                'id': i,
                                'tender': arr[2],
                                'timestamp': arr[3],
                                'unread': is_unread
                            })
                        elif notification_type == "new_bid":
                            # Format: notification#new_bid#tender_title#bidder_name#amount#timestamp#unread/read
                            new_bids.append({
                                'id': i,
                                'tender': arr[2],
                                'bidder': arr[3],
                                'amount': arr[4],
                                'timestamp': arr[5],
                                'unread': is_unread
                            })
                except Exception as e:
                    print(f"Error processing notification: {str(e)}")
                    pass
        
        # Render the notifications template
        context = {
            'edit_requests': edit_requests,
            'new_tenders': new_tenders,
            'new_bids': new_bids,
            'unread_count': unread_count
        }
        return render(request, 'OfficerNotifications.html', context)

def get_cached_officer_tenders():
    """Get cached tender data for officer with optimized performance"""
    global _blockchain_cache
    cache_key = 'officer_tender_data'
    
    # Initialize cache counters if they don't exist
    if 'cache_hits' not in _blockchain_cache:
        _blockchain_cache['cache_hits'] = 0
    if 'cache_misses' not in _blockchain_cache:
        _blockchain_cache['cache_misses'] = 0
    
    if not should_update_cache() and cache_key in _blockchain_cache.get('tender_data', {}):
        _blockchain_cache['cache_hits'] += 1
        return _blockchain_cache['tender_data'][cache_key]
    
    # Initialize tender_data if it doesn't exist
    if 'tender_data' not in _blockchain_cache:
        _blockchain_cache['tender_data'] = {}
    
    _blockchain_cache['cache_misses'] += 1
    from datetime import datetime
    tenders = []
    closed_tenders = []
    winner_titles = set()
    winner_info = {}
    debug_log = []
    now = datetime.now()
    debug_log.append(f"Current server time: {now}")
    
    # Single blockchain scan for efficiency - collect all data in one pass
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                # Collect winner information
                if arr[0] == "winner":
                    tender_title = arr[1]
                    winner_titles.add(tender_title)
                    # Store bidder name and amount if available
                    if len(arr) >= 4:
                        # Format the amount properly
                        try:
                            amount = float(arr[2])
                            if amount > 1000000000:  # If over a billion
                                formatted_amount = f"{amount:.2f}".rstrip('0').rstrip('.')
                            else:
                                formatted_amount = arr[2]
                        except ValueError:
                            formatted_amount = arr[2]
                            
                        winner_info[tender_title] = {
                            'bidder': arr[3],
                            'amount': formatted_amount
                        }
                    else:
                        winner_info[tender_title] = {
                            'bidder': 'Selected',
                            'amount': 'Not recorded'
                        }
            except Exception as e:
                # Log error but continue processing other entries
                debug_log.append(f"Error processing blockchain entry {i}: {str(e)}")
    
    # Special cases lookup dictionaries
    deleted_tenders = {}
    early_closed_tenders = {}
    
    # Pre-collect special cases
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                # Check for deletion entries
                if (arr[0] == "delete" or arr[0] == "delete_tender") and len(arr) >= 2:
                    deleted_tenders[arr[1]] = True
                    
                # Check for early closure entries
                if arr[0] == "close" and len(arr) >= 3:
                    early_closed_tenders[arr[1]] = arr[2]  # tender title -> close date
            except Exception:
                pass
    
    # Collect tenders in a single pass
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                if arr[0] == "tender":
                    title = arr[1]
                    
                    # Skip deleted tenders
                    if title in deleted_tenders:
                        continue
                        
                    description = arr[2]
                    open_date = arr[3]
                    close_date = arr[4]
                    amount = arr[5]
                    open_dt = None
                    close_dt = None
                    
                    # Parse dates
                    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
                        try:
                            open_dt = datetime.strptime(open_date, fmt)
                            break
                        except Exception:
                            continue
                    if open_dt is None:
                        continue
                        
                    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
                        try:
                            close_dt = datetime.strptime(close_date, fmt)
                            break
                        except Exception:
                            continue
                    if close_dt is None:
                        continue
                        
                    # Prepare tender data
                    tender_data = {
                        'title': title,
                        'description': description,
                        'open_date': open_date,
                        'close_date': close_date,
                        'amount': amount
                    }
                    
                    # Check for early closure
                    if title in early_closed_tenders:
                        tender_data['status'] = 'Closed Early'
                        tender_data['close_date'] = early_closed_tenders[title]
                        closed_tenders.append(tender_data)
                        continue
                    
                    # Check if awarded
                    if title in winner_titles:
                        tender_data['status'] = 'Awarded'
                        # Get the bidder username instead of just showing 'Selected'
                        bidder_username = winner_info.get(title, {}).get('bidder', '')
                        tender_data['winner'] = bidder_username
                        tender_data['winning_amount'] = winner_info.get(title, {}).get('amount', 'Not recorded')
                        closed_tenders.append(tender_data)
                        continue
                        
                    # Check if closed
                    if close_dt < now:
                        tender_data['status'] = 'Closed'
                        closed_tenders.append(tender_data)
                        continue
                    
                    # It's an ongoing tender
                    is_future = open_dt > now
                    tender_data['is_future'] = is_future
                    tenders.append(tender_data)
            except Exception as e:
                # Log error but continue processing other entries
                debug_log.append(f"Error parsing tender data: {str(e)}")
                continue
    
    # Store results in cache
    result = {
        'tenders': tenders,
        'closed_tenders': closed_tenders,
        'debug_log': debug_log
    }
    
    _blockchain_cache['tender_data'][cache_key] = result
    return result

def OfficerOngoingTenders(request):
    """Display ongoing tenders with optimized loading using cache"""
    # Get cached data
    data = get_cached_officer_tenders()
    
    # Add notification counts for the template
    current_user = get_current_user()
    unread_count = get_unread_notifications_count(current_user)
    
    # Sort tenders by date (newest first)
    from datetime import datetime as dt
    tenders = data['tenders']
    closed_tenders = data['closed_tenders']
    
    # Helper function to safely parse dates in different formats
    def safe_parse_date(date_str):
        formats = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"]
        for fmt in formats:
            try:
                return dt.strptime(date_str, fmt)
            except (ValueError, TypeError):
                continue
        # If all parsing attempts fail, return a very old date as default
        return dt(2000, 1, 1)  # Default to a very old date if parsing fails
    
    # Sort ongoing tenders by close_date (most recent closing date first)
    try:
        tenders.sort(key=lambda x: safe_parse_date(x['close_date']), reverse=True)
    except Exception as e:
        # If sorting fails for any reason, log it but don't crash
        print(f"Error sorting ongoing tenders: {str(e)}")
    
    # Sort closed tenders by close_date (newest closed first)
    try:
        closed_tenders.sort(key=lambda x: safe_parse_date(x['close_date']), reverse=True)
    except Exception as e:
        # If sorting fails for any reason, log it but don't crash
        print(f"Error sorting closed tenders: {str(e)}")
    
    # Limit closed tenders to the 10 most recent
    limited_closed_tenders = closed_tenders[:10]
    
    # Prepare context
    context = data.copy()
    context['tenders'] = tenders
    context['closed_tenders'] = limited_closed_tenders
    context['unread_count'] = unread_count
    return render(request, 'OfficerOngoingTenders.html', context)


def EditTender(request, tender_title):
    # If the form is submitted (POST request), update the tender
    if request.method == 'POST':
        title = request.POST.get('title', '')
        description = request.POST.get('description', '')
        open_date = request.POST.get('open_date', '')
        close_date = request.POST.get('close_date', '')
        amount = request.POST.get('amount', '')
        
        # Delete the old tender and add a new one
        # Since blockchain can't be directly edited, we need to mark old tender as deleted
        # and add a new one with updated details
        
        # First, add a transaction marking the old tender as deleted
        data = f"delete_tender#{tender_title}"
        data_encoded = str(base64.b64encode(encrypt(str(data))),'utf-8')
        blockchain.add_new_transaction(data_encoded)
        hash = blockchain.mine()
        
        # Then, add the new updated tender
        data = f"tender#{title}#{description}#{open_date}#{close_date}#{amount}"
        data_encoded = str(base64.b64encode(encrypt(str(data))),'utf-8')
        blockchain.add_new_transaction(data_encoded)
        hash = blockchain.mine()
        
        # Redirect back to ongoing tenders page
        return redirect('OfficerOngoingTenders')
    
    # GET request - show the edit form with current tender details
    tender_data = None
    # Search for this tender in the blockchain
    for i in range(len(blockchain.chain)):
        if i > 0:
            b = blockchain.chain[i]
            data = b.transactions[0]
            data = base64.b64decode(data)
            data = str(decrypt(data))
            data = data[2:len(data)-1]
            arr = data.split("#")
            if arr[0] == "tender" and arr[1] == tender_title:
                tender_data = {
                    'title': arr[1],
                    'description': arr[2],
                    'open_date': arr[3],
                    'close_date': arr[4],
                    'amount': arr[5]
                }
                break
    
    if tender_data is None:
        # Tender not found
        return redirect('OfficerOngoingTenders')
    
    context = {'tender': tender_data}
    return render(request, 'EditTender.html', context)


def DeleteTender(request):
    # Get the title from the query parameters
    tender_title = request.GET.get('title', '')
    
    if tender_title:
        # Add a transaction marking the tender as deleted
        data = f"delete_tender#{tender_title}"
        data_encoded = str(base64.b64encode(encrypt(str(data))),'utf-8')
        blockchain.add_new_transaction(data_encoded)
        hash = blockchain.mine()
        
        # Save changes to blockchain file
        blockchain.save_object(blockchain, 'blockchain_contract.txt')
        
        # For debugging - print delete success message
        print(f"Successfully deleted tender: {tender_title}")
    
    # Redirect back to ongoing tenders page
    return redirect('OfficerOngoingTenders')


def CloseTender(request):
    # Get the title from the query parameters
    tender_title = request.GET.get('title', '')
    
    if tender_title:
        # Get current date as close date
        current_date = datetime.now().strftime('%d-%m-%Y')
        
        # Add a transaction marking the tender as closed early
        data = f"close_tender#{tender_title}#{current_date}"
        data_encoded = str(base64.b64encode(encrypt(str(data))),'utf-8')
        blockchain.add_new_transaction(data_encoded)
        hash = blockchain.mine()
        
        # Save changes to blockchain file
        blockchain.save_object(blockchain, 'blockchain_contract.txt')
        
        # For debugging - print close success message
        print(f"Successfully closed tender: {tender_title} on {current_date}")
    
    # Redirect back to ongoing tenders page
    return redirect('OfficerOngoingTenders')


def index(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})
    
def Logout(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})        

def Login(request):
    if request.method == 'GET':
       return render(request, 'Login.html', {})
       

def ClearTenderData_Direct():
    """Direct function to clear tender data while preserving user accounts - can be called from scripts"""
    try:
        original_blockchain = None
        if os.path.exists('blockchain_contract.txt'):
            with open('blockchain_contract.txt', 'rb') as fileinput:
                original_blockchain = pickle.load(fileinput)
            fileinput.close()
        else:
            print("No blockchain data found!")
            return False
            
        new_blockchain = Blockchain()
        accounts = []
        
        print(f"Original blockchain length: {len(original_blockchain.chain)}")
        print("Scanning for account records...")
        
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
                    
                    print(f"Preserved account: {username}")
            except Exception as e:
                print(f"Error processing block {i}: {str(e)}")
                continue
        
        # Save the new blockchain
        print(f"Saving new blockchain with {len(accounts)} accounts")
        new_blockchain.save_object(new_blockchain, 'blockchain_contract.txt')
        print("Data cleanup complete!")
        print(f"Accounts preserved: {accounts}")
        return True
    except Exception as e:
        print(f"Error during data cleanup: {str(e)}")
        return False

def ClearTenderData(request):
    if request.method == 'GET':
        return render(request, 'admin/clear_data.html', {'message': 'Click the button to clear all tender data. Account information will be preserved.'})
    
    elif request.method == 'POST':
        try:
            # Load the original blockchain
            original_blockchain = None
            if os.path.exists('blockchain_contract.txt'):
                with open('blockchain_contract.txt', 'rb') as fileinput:
                    original_blockchain = pickle.load(fileinput)
                fileinput.close()
            else:
                return render(request, 'admin/clear_data.html', {'error': 'No blockchain data found!'})
            
            # Create a new blockchain with only the genesis block
            new_blockchain = Blockchain()
            
            # Keep track of accounts found
            accounts = []
            
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
                        enc = str(base64.b64encode(enc),'utf-8')
                        new_blockchain.add_new_transaction(enc)
                        hash = new_blockchain.mine()
                except:
                    continue
            
            # Save the new blockchain
            new_blockchain.save_object(new_blockchain, 'blockchain_contract.txt')
            
            # Create success message showing preserved accounts
            message = f"Data cleanup complete! Preserved {len(accounts)} user accounts:<br/>"
            message += "<ul>"
            for account in accounts:
                message += f"<li>{account}</li>"
            message += "</ul>"
            
            return render(request, 'admin/clear_data.html', {'success': message})
            
        except Exception as e:
            error_message = f"Error during data cleanup: {str(e)}"
            return render(request, 'admin/clear_data.html', {'error': error_message})

# Keep these for backward compatibility
def TenderLogin(request):
    if request.method == 'GET':
       return redirect('Login')

def BidderLogin(request):
    if request.method == 'GET':
       return redirect('Login')    
    
def Register(request):
    if request.method == 'GET':
       return render(request, 'Register.html', {})

def BidTenderAction(request):
    if request.method == 'GET':
        # Get the tender title from the query parameters
        # Remove any quotes that might be in the URL parameter
        title = request.GET.get('title', '')
        title = title.replace('"', '')
        
        # Create a properly formatted form input that works with our new form design
        output = f'<input type="text" name="t1" id="tenderTitle" class="form-control" value="{title}" readonly>'
        
        context = {
            'data1': output,
            'title': title  # Pass the raw title separately in case we need it
        }
        
        return render(request, 'BidTenderAction.html', context)
        
        
def is_tender_deleted(tender_title):
    """Check if a tender has been marked as deleted"""
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                
                arr = data.split("#")
                if arr[0] == "delete_tender" and arr[1] == tender_title:
                    return True
            except Exception:
                pass
    return False

def is_tender_closed_early(tender_title):
    """Check if a tender has been manually closed early"""
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                
                arr = data.split("#")
                if arr[0] == "close_tender" and arr[1] == tender_title:
                    return True, arr[2] if len(arr) > 2 else datetime.now().strftime('%d-%m-%Y')
            except Exception:
                pass
    return False, None


def get_cached_tenders(current_user):
    """Get active tenders with user bid status, using cache when possible"""
    global _blockchain_cache

    # Ensure required cache keys exist
    if 'cache_misses' not in _blockchain_cache:
        _blockchain_cache['cache_misses'] = 0
    if 'cache_hits' not in _blockchain_cache:
        _blockchain_cache['cache_hits'] = 0
    if 'tender_data' not in _blockchain_cache:
        _blockchain_cache['tender_data'] = {}
    
    # Make sure _blockchain_cache is properly initialized
    ensure_blockchain_cache_initialized()
    
    cache_key = f'active_tenders_{current_user}'
    
    # Return cached data if available and recent
    if not should_update_cache() and cache_key in _blockchain_cache['tender_data']:
        _blockchain_cache['cache_hits'] += 1
        return _blockchain_cache['tender_data'][cache_key]
    
    _blockchain_cache['cache_misses'] += 1
    
    # Process blockchain data for tenders and bids
    tender_list = []
    user_bids = {}
    deleted_tenders = {}
    awarded_tenders = {}
    closed_tenders = {}
    
    # First pass: collect metadata about tenders (deleted, awarded, closed) and user bids
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                # Track user bids
                if arr[0] == 'bidding' and len(arr) >= 5:
                    bidder_name = arr[4]
                    tender_title = arr[1]
                    if current_user == bidder_name:
                        user_bids[tender_title] = True
                
                # Track tender status changes
                elif arr[0] == "delete_tender" and len(arr) >= 2:
                    deleted_tenders[arr[1]] = True
                elif arr[0] == "award_tender" and len(arr) >= 2:
                    awarded_tenders[arr[1]] = True
                elif arr[0] == "close_tender" and len(arr) >= 2:
                    closed_tenders[arr[1]] = True
                elif arr[0] == "winner" and len(arr) >= 2:
                    awarded_tenders[arr[1]] = True
            except Exception:
                continue

    # Second pass: collect active tenders that aren't deleted, awarded, or closed
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                if arr[0] == 'tender' and len(arr) >= 9:
                    tender_title = arr[1]
                    
                    # Skip if tender has been deleted, awarded or closed
                    if (tender_title in deleted_tenders or 
                        tender_title in awarded_tenders or 
                        tender_title in closed_tenders):
                        continue
                    
                    # Check if user has already bid on this tender
                    has_submitted_bid = tender_title in user_bids
                    
                    # Skip tenders that the bidder has already bid on as they shouldn't see them in the list
                    if has_submitted_bid:
                        continue
                        
                    # Extract tender data
                    tender_data = {
                        'title': arr[1],
                        'description': arr[2],
                        'start_date': arr[3],
                        'end_date': arr[4],
                        'amount': arr[5],
                        'industry': arr[6],
                        'tender_type': arr[7] if len(arr) > 7 else 'General',
                        'created_by': arr[8] if len(arr) > 8 else 'Unknown',
                        'has_submitted_bid': has_submitted_bid
                    }
                    
                    # Check if the tender is active based on dates
                    now = datetime.datetime.now()
                    open_dt = None
                    close_dt = None
                    
                    # Try multiple date formats
                    for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"]:
                        try:
                            open_dt = datetime.datetime.strptime(tender_data['start_date'], fmt)
                            break
                        except:
                            continue
                            
                    for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"]:
                        try:
                            close_dt = datetime.datetime.strptime(tender_data['end_date'], fmt)
                            break
                        except:
                            continue
                    
                    # Skip tenders that couldn't be parsed or are closed
                    if open_dt is None or close_dt is None or close_dt < now:
                        continue
                        
                    tender_list.append(tender_data)
            except Exception:
                continue
    
    # Update cache
    _blockchain_cache['tender_data'][cache_key] = tender_list
    
    return tender_list


def ensure_blockchain_cache_initialized():
    """Ensure the blockchain cache is properly initialized with all required keys"""
    global _blockchain_cache
    
    # If _blockchain_cache is None or not a dict, reinitialize it
    if not isinstance(_blockchain_cache, dict):
        _blockchain_cache = {}
    
    # Ensure all required keys exist
    required_keys = {
        'user_notifications': {}, 
        'tender_data': {}, 
        'bid_data': {},
        'last_chain_length': 0,
        'last_update': datetime.datetime.now(),
        'cache_hits': 0,
        'cache_misses': 0
    }
    
    # Add any missing keys
    for key, default_value in required_keys.items():
        if key not in _blockchain_cache:
            _blockchain_cache[key] = default_value


def BidTender(request):
    """View to display active tenders for bidding with improved loading speed"""
    if request.method == 'GET':
        # Get current user
        current_user = get_current_user()
        
        # Make sure cache is initialized
        ensure_blockchain_cache_initialized()
            
        # Get cached tenders or fetch them if cache is invalid
        tenders = get_cached_tenders(current_user)
        
        # Create modern card-based layout
        output = '<div class="tender-grid">'
        found_tenders = False
        
        # Generate HTML for each tender
        for tender in tenders:
            found_tenders = True
            title = tender['title']
            description = tender['description']
            open_date = tender['start_date']
            close_date = tender['end_date']
            amount = tender['amount']
            industry = tender['industry']
            has_submitted_bid = tender['has_submitted_bid']
            
            # Check if tender is in the future
            now = datetime.datetime.now()
            open_dt = None
            for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"]:
                try:
                    open_dt = datetime.datetime.strptime(open_date, fmt)
                    break
                except:
                    continue
            
            is_future = open_dt and open_dt > now
            
            # Create a modern card for each tender with consistent height
            output += f'''<div class="tender-card">
                <div class="tender-card-header">
                    <h4>{title}</h4>
                    <span class="badge badge-success"><i class="fas fa-clock"></i> Open To Bid</span>
                </div>
                <div class="tender-card-body">
                    <div class="tender-details">
                        <p><i class="fas fa-calendar-plus"></i> Open: {open_date}</p>
                        <p><i class="fas fa-calendar-times"></i> Close: {close_date}</p>
                        <p><i class="fas fa-coins"></i> Amount: {amount}</p>
                        <p><i class="fas fa-industry"></i> Industry: {industry}</p>
                    </div>
                </div>
                <div class="tender-card-actions">
                    <a href="TenderDetail?title={title}" class="btn btn-sm btn-outline-primary"><i class="fas fa-eye"></i> View Details</a>
                    {'' if has_submitted_bid else f'<a href="BidTenderAction?title={title}" class="btn btn-sm action-btn"><i class="fas fa-gavel"></i> Submit Bid</a>'}
                    {f'<span class="badge badge-info mt-2"><i class="fas fa-check-circle"></i> Bid Submitted</span>' if has_submitted_bid else ''}
                </div>
            </div>'''
        
        output += '</div>'
        
        # Only set the output if tenders were found
        if not found_tenders:
            output = ''
        
        # Add unread notification count to the context
        unread_notification_count = get_unread_notifications_count(current_user)
        
        context = {
            'data': output,
            'unread_notification_count': unread_notification_count
        }
        return render(request, 'BidTender.html', context)
def TenderDetail(request):
    """View tender details with optimized loading"""
    if request.method == 'GET':
        # Get the tender title from the query parameters
        title = request.GET.get('title', '')
        title = title.replace('"', '')
        
        tender_data = None
        
        # Check if the tender has been deleted
        if is_tender_deleted(title):
            # Return with no tender data to show the 'Tender Not Found' message
            context = {'tender': None}
            return render(request, 'TenderDetail.html', context)
        
        # Get current user for notification count
        current_user = get_current_user()
        unread_notification_count = get_unread_notifications_count(current_user)
        
        # Search for the tender in the blockchain
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    
                    arr = data.split("#")
                    if arr[0] == "tender" and arr[1] == title:
                        # Check if this tender is available (no winner)
                        winner_status = getWinner(arr[1])
                        
                        if winner_status == "none":
                            # Format: tender#title#description#open_date#close_date#amt#industry#category#location#eligibility#specifications
                            tender_data = {
                                'title': arr[1],
                                'description': arr[2],
                                'open_date': arr[3],
                                'close_date': arr[4],
                                'amount': arr[5],
                                'industry': arr[6],
                                'category': arr[7] if len(arr) > 7 else '',
                                'location': arr[8] if len(arr) > 8 else '',
                                'eligibility': arr[9] if len(arr) > 9 else '',
                                'specifications': arr[10] if len(arr) > 10 else ''
                            }
                            break
                except Exception as e:
                    # Log exception but continue processing other blocks
                    print(f"Error processing tender details for {title}: {str(e)}")
                    pass
        
        context = {
            'tender': tender_data,
            'unread_notification_count': unread_notification_count
        }
        return render(request, 'TenderDetail.html', context)


def ViewTender(request):
    if request.method == 'GET':
        # Get current user from session
        current_user = ''
        try:
            with open("session.txt", "r") as file:
                for line in file:
                    current_user = line.strip('\n')
            file.close()
        except:
            pass
            
        # Use modern table styling that works with our CSS
        output = '<table class="table table-striped">'
        output += '<thead><tr><th>Tender Title</th><th>Amount</th><th>Username</th><th>Status</th><th>Action</th></tr></thead><tbody>'
        
        bids_found = False
        user_bids = {}
        
        # First pass: collect all biddings by the current user to avoid redundant blockchain scanning
        # Also check for edit requests and approvals
        edit_requests = {}
        edit_approvals = {}
        
        # First check for edit approvals
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    if arr[0] == "edit_approval" and arr[2] == current_user:
                        edit_approvals[arr[1]] = arr[3]  # tender_title: approval_status
                except Exception:
                    pass
        
        # Then check for edit requests
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    if arr[0] == "edit_request" and arr[2] == current_user:
                        edit_requests[arr[1]] = True  # tender_title: requested
                except Exception:
                    pass
                    
        # Now collect all bids - this is the critical part
        print(f"Looking for bids for user: {current_user}")
        
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    # Debug output to help trace the issue
                    if arr[0] == "bidding":
                        print(f"Found bid record: {arr[0]} - Title: {arr[1]} - User: {arr[3]} (current: {current_user})")
                        print(f"Full bid data format: {arr}")
                    
                    # Format from BidTenderActionPage: bidding#title#amount#user#Pending#company_name#...etc
                    # We need to match the format correctly - user is in position 3
                    if arr[0] == "bidding" and arr[3] == current_user:
                        print(f"Found matching bid for {current_user} on tender {arr[1]}")
                        bids_found = True
                        tender_title = arr[1]
                        
                        edit_status = "none"
                        if tender_title in edit_requests:
                            edit_status = "requested"
                        if tender_title in edit_approvals:
                            edit_status = edit_approvals[tender_title]  # approved or rejected
                        
                        # Get bid status
                        bid_status = getWinners(tender_title, current_user)
                        print(f"Bid status for {tender_title}: {bid_status}")
                        
                        # If status is empty, set to 'Pending'
                        if not bid_status:
                            bid_status = 'Pending'

                        # Store bid info for display
                        if tender_title not in user_bids:
                            user_bids[tender_title] = {
                                'amount': arr[2],
                                'status': bid_status,
                                'edit_status': edit_status
                            }
                except Exception as e:
                    # Skip any entries with parsing issues
                    pass
        
        # Generate table rows from the collected data
        for tender_title, bid_info in user_bids.items():
            # Skip entries with 'Not Bid' status - we only want to show tenders the user has actually bid on
            if bid_info['status'] == 'Not Bid':
                continue
                
            badge_class = "badge-secondary"
            icon_class = "fa-clock"
            edit_action = ""
            
            if bid_info['status'] == 'Winner':
                badge_class = "badge-success"
                icon_class = "fa-trophy"
            elif bid_info['status'] == 'Lost':
                badge_class = "badge-danger"
                icon_class = "fa-times-circle"
            elif bid_info['status'] == 'Closed':
                badge_class = "badge-info"
                icon_class = "fa-lock"
            elif bid_info['status'] == 'Pending':
                badge_class = "badge-warning"
                icon_class = "fa-hourglass"
            
            # Add action buttons based on status
            if bid_info['status'] == 'Pending':
                if bid_info['edit_status'] == 'requested':
                    edit_action = f'<button class="btn btn-sm btn-info" disabled><i class="fas fa-clock"></i> Edit Request Sent</button>'
                elif bid_info['edit_status'] == 'approved':
                    edit_action = f'<a href="/EditBidTenderAction?title={tender_title}" class="btn btn-sm btn-success"><i class="fas fa-pencil-alt"></i> Edit Bid Now</a>'
                elif bid_info['edit_status'] == 'rejected':
                    edit_action = f'<button class="btn btn-sm btn-danger" disabled><i class="fas fa-times-circle"></i> Edit Request Rejected</button>'
                else:
                    edit_action = f'<a href="/RequestBidEdit?title={tender_title}" class="btn btn-sm btn-primary"><i class="fas fa-edit"></i> Request Edit</a>'
            
            output += f'<tr>'
            output += f'<td>{tender_title}</td>'
            output += f'<td>{bid_info["amount"]}</td>'
            output += f'<td>{current_user}</td>'
            output += f'<td><span class="badge {badge_class}"><i class="fas {icon_class}"></i> {bid_info["status"]}</span></td>'
            output += f'<td>{edit_action}</td>'
            output += f'</tr>'
        
        output += '</tbody></table>'
        
        # If no bids were found, show a message instead of empty string
        if not bids_found:
            output = '<div class="alert alert-info"><i class="fas fa-info-circle"></i> You haven\'t submitted any bids yet. Go to the "Bid Tender" page to participate in available tenders.</div>'
            
        context = {'data': output}
        return render(request, 'ViewTender.html', context)

def RequestBidEdit(request):
    """Handle bid edit requests from bidders"""
    if request.method == 'GET':
        title = request.GET.get('title', '')
        title = title.replace('"', '')
        
        if not title:
            return HttpResponse("Invalid request. Missing tender title.")
        
        # Get current user from session
        current_user = ''
        try:
            with open("session.txt", "r") as file:
                for line in file:
                    current_user = line.strip('\n')
            file.close()
        except:
            return HttpResponse("Session error. Please log in again.")
        
        # Check if bid exists for this user and tender
        bid_exists = False
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    if arr[0] == "bidding" and arr[1] == title and arr[4] == current_user:
                        bid_exists = True
                        break
                except Exception:
                    pass
        
        if not bid_exists:
            return HttpResponse("You have not placed a bid for this tender.")
        
        # Check if an edit request already exists
        request_exists = False
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    if arr[0] == "edit_request" and arr[1] == title and arr[2] == current_user:
                        request_exists = True
                        break
                except Exception:
                    pass
        
        if request_exists:
            return HttpResponse("You have already requested to edit this bid. Please wait for approval.")
        
        # Create edit request
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        edit_request = f"edit_request#{title}#{current_user}#{timestamp}"
        
        # Encrypt and add to blockchain
        edit_request = edit_request.encode()
        edit_request = base64.b64encode(encrypt(edit_request))
        transaction = edit_request.decode("utf-8")
        blockchain.add_block(Block(len(blockchain.chain), str(datetime.datetime.now()), transaction, ""))
        
        # Create notification for tender officer
        notification_data = f"notification#edit_request#{title}#{current_user}#{timestamp}#unread"
        notification_data = notification_data.encode()
        notification_data = base64.b64encode(encrypt(notification_data))
        transaction = notification_data.decode("utf-8")
        blockchain.add_block(Block(len(blockchain.chain), str(datetime.datetime.now()), transaction, ""))
        
        # Redirect back to ViewTender page with success message
        messages.success(request, "Edit request submitted successfully! Please wait for officer approval.")
        return redirect('ViewTender')

def getWinner(title):
    output = 'none'
    for i in range(len(blockchain.chain)):
        if i > 0:
            b = blockchain.chain[i]
            data = b.transactions[0]
            data = base64.b64decode(data)
            data = str(decrypt(data))
            data = data[2:len(data)-1]
            arr = data.split("#")
            if arr[0] == "winner" and arr[1] == title:
                output = title
                print("output",output)
                break
    return output

def getWinners(title, bidder):
    """Get the status of a bid for a specific user and tender"""
    # Ensure blockchain cache is initialized
    global _blockchain_cache
    ensure_blockchain_cache_initialized()
    
    # Default status is Pending
    output = 'Pending'
    winner_exists = False
    winner_is_current_bidder = False
    is_closed = False
    found_tender = False
    
    # First check if tender has a declared winner (search backwards for efficiency)
    for i in range(len(blockchain.chain)-1, -1, -1):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                
                # Check for winner declaration
                if arr[0] == "winner" and arr[1] == title:
                    winner_exists = True
                    winning_username = arr[4] # Winner username is in position 4
                    if winning_username == bidder:
                        winner_is_current_bidder = True
                    break
            except Exception as e:
                print(f"Error checking winner for {title}: {str(e)}")
                pass
    
    # If no winner found, check if tender is closed by date
    if not winner_exists:
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    if arr[0] == "tender" and arr[1] == title:
                        found_tender = True
                        close_date = arr[4]
                        close_dt = None
                        for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
                            try:
                                close_dt = datetime.datetime.strptime(close_date, fmt)
                                break
                            except:
                                continue
                        if close_dt and close_dt < datetime.datetime.now():
                            is_closed = True
                        break
                except Exception as e:
                    print(f"Error checking tender close date for {title}: {str(e)}")
                    pass
    
    # We no longer need to check if the user placed a bid since we're only calling this
    # function for tenders the user has already bid on
    if winner_exists:
        if winner_is_current_bidder:
            output = "Winner"
        else:
            output = "Lost"
    elif is_closed:
        output = "Closed"
    else:
        output = "Pending"
        
    return output

def EvaluateTender(request):
    if request.method == 'GET':
        # Dictionary to store tenders and all their bids with complete details
        all_tenders = {}
        winner_data = {}
        rejected_bids = {}
        
        # First pass - collect all relevant data including rejected bids
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    # Store winner information
                    if arr[0] == "winner":
                        winner_data[arr[1]] = arr[4]  # Store tender winner
                    
                    # Store rejected bid information
                    elif arr[0] == "reject":
                        tender_title = arr[1]
                        username = arr[3]
                        if tender_title not in rejected_bids:
                            rejected_bids[tender_title] = []
                        rejected_bids[tender_title].append(username)
                    
                    # Store all bidding information
                    elif arr[0] == "bidding":
                        tender_title = arr[1]
                        bid_amount = float(arr[2])
                        username = arr[3]
                        status = arr[4]  # Pending, Rejected etc.
                        
                        # Skip tenders that already have winners
                        if tender_title in winner_data:
                            continue
                            
                        # Skip bids that are already processed (not Pending)
                        if status != "Pending":
                            continue
                            
                        # Skip rejected bids
                        if tender_title in rejected_bids and username in rejected_bids[tender_title]:
                            continue
                        
                        # Additional bid details (might be in different positions depending on schema)
                        company_name = arr[5] if len(arr) > 5 else "Not specified"
                        contact_person = arr[6] if len(arr) > 6 else "Not specified"
                        email = arr[7] if len(arr) > 7 else "Not specified"
                        phone = arr[8] if len(arr) > 8 else "Not specified"
                        completion_days = arr[9] if len(arr) > 9 else "Not specified"
                        proposal_summary = arr[10] if len(arr) > 10 else "Not specified"
                        experience = arr[11] if len(arr) > 11 else "Not specified"
                        
                        # Store bid with complete details
                        if tender_title not in all_tenders:
                            all_tenders[tender_title] = []
                            
                        all_tenders[tender_title].append({
                            'bid_amount': bid_amount,
                            'username': username,
                            'company_name': company_name,
                            'contact_person': contact_person,
                            'email': email,
                            'phone': phone,
                            'completion_days': completion_days,
                            'proposal_summary': proposal_summary,
                            'experience': experience,
                            'timestamp': b.timestamp  # Include timestamp for sorting
                        })
                except Exception as e:
                    # Skip any entries with parsing issues
                    continue
        
        # Sort bids for each tender by timestamp (newest first)
        for title in all_tenders:
            all_tenders[title].sort(key=lambda x: x['timestamp'], reverse=True)
        
        # Build HTML for each tender with all its bids
        output = ''
        found_tenders = False
        
        for title, bids in all_tenders.items():
            if not bids:  # Skip tenders with no bids
                continue
                
            found_tenders = True
            
            # Create a card for each tender
            output += f'''
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">{title}</h5>
                </div>
                <div class="card-body">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Bid Amount</th>
                                <th>Company</th>
                                <th>Contact Person</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Days to Complete</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
            '''
            
            # Add rows for each bid
            for bid in bids:
                # Generate data strings for action buttons
                reject_data = f"reject#{title}#{bid['bid_amount']}#{bid['username']}"
                winner_data = f"winner#{title}#{bid['bid_amount']}#{title}#{bid['username']}"
                
                output += f'''
                <tr>
                    <td>{bid['bid_amount']}</td>
                    <td>{bid['company_name']}</td>
                    <td>{bid['contact_person']}</td>
                    <td>{bid['email']}</td>
                    <td>{bid['phone']}</td>
                    <td>{bid['completion_days']}</td>
                    <td>
                        <div class="btn-group">
                            <button onclick="selectWinner('{winner_data}')" class="btn btn-sm btn-success"><i class="fas fa-crown"></i> Select Winner</button>
                            <button onclick="rejectBid('{reject_data}')" class="btn btn-sm btn-danger"><i class="fas fa-times"></i> Reject</button>
                            <button type="button" class="btn btn-sm btn-info" data-toggle="collapse" data-target="#details-{title.replace(' ', '_')}-{bid['username'].replace(' ', '_')}"><i class="fas fa-info-circle"></i> Details</button>
                        </div>
                    </td>
                </tr>
                <tr class="collapse" id="details-{title.replace(' ', '_')}-{bid['username'].replace(' ', '_')}">
                    <td colspan="7">
                        <div class="card card-body">
                            <h6>Proposal Summary:</h6>
                            <p>{bid['proposal_summary']}</p>
                            <h6>Experience:</h6>
                            <p>{bid['experience']}</p>
                        </div>
                    </td>
                </tr>
                '''
                
            output += '''
                        </tbody>
                    </table>
                </div>
            </div>
            '''
        
        # Include JavaScript to handle winner selection and bid rejection
        output += '''
        <script>
        function selectWinner(winnerData) {
            if (confirm("Are you sure you want to select this bidder as the winner? This action cannot be undone.")) {
                // Create a form to submit the winner data
                var form = document.createElement("form");
                form.setAttribute("method", "post");
                form.setAttribute("action", "evaluateWinner");
                
                var csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                var csrfInput = document.createElement("input");
                csrfInput.setAttribute("type", "hidden");
                csrfInput.setAttribute("name", "csrfmiddlewaretoken");
                csrfInput.setAttribute("value", csrfToken);
                form.appendChild(csrfInput);
                
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", "winner_data");
                hiddenField.setAttribute("value", winnerData);
                form.appendChild(hiddenField);
                
                document.body.appendChild(form);
                form.submit();
            }
        }
        
        function rejectBid(rejectData) {
            if (confirm("Are you sure you want to reject this bid? This action cannot be undone.")) {
                // Create a form to submit the reject data
                var form = document.createElement("form");
                form.setAttribute("method", "post");
                form.setAttribute("action", "/evaluateReject");
                
                var csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;
                var csrfInput = document.createElement("input");
                csrfInput.setAttribute("type", "hidden");
                csrfInput.setAttribute("name", "csrfmiddlewaretoken");
                csrfInput.setAttribute("value", csrfToken);
                form.appendChild(csrfInput);
                
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", "reject_data");
                hiddenField.setAttribute("value", rejectData);
                form.appendChild(hiddenField);
                
                document.body.appendChild(form);
                form.submit();
            }
        }
        </script>
        '''
        
        # If no tenders found for evaluation, show empty state
        if not found_tenders:
            output = '<div class="alert alert-info">No pending tenders found for evaluation.</div>'
        
        context = {'data': output}
        return render(request, 'EvaluateTender.html', context)
        
    # Handle POST for bid rejection - will be handled by evaluateReject view function
    return redirect('EvaluateTender')

# Handle bid rejection from the Evaluate Tender page
def evaluateReject(request):
    if request.method == 'POST':
        # Get the reject data from the form
        reject_data = request.POST.get('reject_data')
        
        # Parse reject data
        arr = reject_data.split('#')
        if len(arr) >= 4:
            tender_title = arr[1]
            bid_amount = arr[2]
            username = arr[3]
            
            # Create a blockchain transaction to mark this bid as rejected
            reject_transaction = f"reject#{tender_title}#{bid_amount}#{username}#{datetime.datetime.now()}"
            enc = encrypt(str(reject_transaction))
            blockchain.add_new_transaction(base64.b64encode(enc).decode('utf-8'))
            blockchain.mine()
            
            # Update the blockchain file
            with open('blockchain_contract.txt', 'wb') as fileoutput:
                pickle.dump(blockchain, fileoutput)
            fileoutput.close()
            
            # Clear cache to reflect new state immediately
            global _blockchain_cache
            _blockchain_cache['last_update'] = None
            
            # Create a notification for the bidder
            notification_data = f"notification#{username}#Your bid for '{tender_title}' has been rejected.#Bid Rejected#danger"
            enc = encrypt(str(notification_data))
            blockchain.add_new_transaction(base64.b64encode(enc).decode('utf-8'))
            blockchain.mine()
            
            # Update the blockchain file again
            with open('blockchain_contract.txt', 'wb') as fileoutput:
                pickle.dump(blockchain, fileoutput)
            fileoutput.close()
            
            # Create a message for the officer
            messages.success(request, f"Bid from {username} for tender '{tender_title}' has been rejected successfully.")
        
    return redirect('EvaluateTender')

# Handle winner selection
def evaluateWinner(request):
    if request.method == 'POST':
        # Get the winner data from the form
        winner_data = request.POST.get('winner_data')
        
        # Parse the winner data
        arr = winner_data.split('#')
        if len(arr) >= 5:
            tender_title = arr[1]
            bid_amount = arr[2]
            username = arr[4]  # Winner username
            
            # Create winner transaction
            enc = encrypt(str(winner_data))
            enc = str(base64.b64encode(enc), 'utf-8')
            blockchain.add_new_transaction(enc)
            blockchain.mine()
            
            # Update blockchain file
            with open('blockchain_contract.txt', 'wb') as fileoutput:
                pickle.dump(blockchain, fileoutput)
            fileoutput.close()
            
            # Clear cache to reflect new state immediately
            global _blockchain_cache
            _blockchain_cache['last_update'] = None
            
            # Create a notification for the winner
            winner_notification = f"notification#{username}#Congratulations! Your bid for '{tender_title}' has been selected as the winning bid!#Bid Won#success"
            enc = encrypt(str(winner_notification))
            blockchain.add_new_transaction(base64.b64encode(enc).decode('utf-8'))
            blockchain.mine()
            
            # Create notifications for all other bidders that submitted to this tender
            # First identify all users who bid on this tender
            bidders = []
            for i in range(len(blockchain.chain)):
                if i > 0:
                    try:
                        b = blockchain.chain[i]
                        data = b.transactions[0]
                        data = base64.b64decode(data)
                        data = str(decrypt(data))
                        data = data[2:len(data)-1]
                        arr = data.split("#")
                        
                        # Only look at bidding records
                        if arr[0] == "bidding" and arr[1] == tender_title:
                            bidder = arr[3]
                            if bidder != username and bidder not in bidders:
                                bidders.append(bidder)
                    except Exception as e:
                        continue
            
            # Notify all other bidders that they did not win
            for bidder in bidders:
                loser_notification = f"notification#{bidder}#The tender '{tender_title}' has been awarded to another bidder.#Bid Result#warning"
                enc = encrypt(str(loser_notification))
                blockchain.add_new_transaction(base64.b64encode(enc).decode('utf-8'))
                blockchain.mine()
            
            # Update blockchain file again
            with open('blockchain_contract.txt', 'wb') as fileoutput:
                pickle.dump(blockchain, fileoutput)
            fileoutput.close()
            
            # Create a message for the officer
            messages.success(request, f"Winner selected successfully for tender '{tender_title}'!")
    
    # Redirect to winner selection page
    return redirect('WinnerSelection')                                    
                    
       

def WinnerSelection(request):
    if request.method == 'GET':
        # Dictionary to store all tenders with winners and their details
        winners = {}
        all_bids = {}
        tender_details = {}
        
        # First pass: collect all tender information, winners and bids
        for i in range(len(blockchain.chain)):
            if i > 0:
                try:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    
                    # Record tender information
                    if arr[0] == "tender":
                        tender_title = arr[1]
                        tender_details[tender_title] = {
                            'description': arr[2],
                            'amount': arr[3],
                            'close_date': arr[4],
                            'category': arr[5] if len(arr) > 5 else 'Not specified'
                        }
                    
                    # Record winner information
                    elif arr[0] == "winner":
                        tender_title = arr[1]
                        bid_amount = arr[2]
                        username = arr[4]
                        
                        winners[tender_title] = {
                            'amount': bid_amount,
                            'username': username,
                            'timestamp': b.timestamp
                        }
                    
                    # Record all bid information for each tender
                    elif arr[0] == "bidding":
                        tender_title = arr[1]
                        bid_amount = float(arr[2])
                        username = arr[3]
                        status = arr[4]
                        
                        # Additional bid details
                        company_name = arr[5] if len(arr) > 5 else "Not specified"
                        contact_person = arr[6] if len(arr) > 6 else "Not specified"
                        email = arr[7] if len(arr) > 7 else "Not specified"
                        phone = arr[8] if len(arr) > 8 else "Not specified"
                        completion_days = arr[9] if len(arr) > 9 else "Not specified"
                        proposal_summary = arr[10] if len(arr) > 10 else "Not specified"
                        experience = arr[11] if len(arr) > 11 else "Not specified"
                        
                        if tender_title not in all_bids:
                            all_bids[tender_title] = []
                            
                        all_bids[tender_title].append({
                            'bid_amount': bid_amount,
                            'username': username,
                            'company_name': company_name,
                            'contact_person': contact_person,
                            'email': email,
                            'phone': phone,
                            'completion_days': completion_days,
                            'proposal_summary': proposal_summary,
                            'experience': experience,
                            'status': status,
                            'timestamp': b.timestamp
                        })
                except Exception as e:
                    # Skip any entries with parsing issues
                    continue
        
        # Build HTML with cards for each tender with a winner
        output = ''
        found_winners = False
        
        for title, winner_data in winners.items():
            found_winners = True
            
            # Get tender details if available
            tender_info = tender_details.get(title, {})
            tender_description = tender_info.get('description', 'No description available')
            tender_category = tender_info.get('category', 'Not specified')
            
            # Create a card for each tender with winner
            output += f'''
            <div class="card mb-4">
                <div class="card-header bg-success text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">{title}</h5>
                        <span class="badge badge-light"><i class="fas fa-tag"></i> {tender_category}</span>
                    </div>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col">
                            <h6>Description:</h6>
                            <p>{tender_description}</p>
                        </div>
                    </div>
                    <div class="winner-info alert alert-success">
                        <h6><i class="fas fa-trophy"></i> Winner</h6>
                        <div class="row">
                            <div class="col-md-4">
                                <strong>Bidder:</strong> {winner_data['username']}
                            </div>
                            <div class="col-md-4">
                                <strong>Winning Amount:</strong> {winner_data['amount']}
                            </div>
                        </div>
                    </div>
            '''
            
            # If we have bids data for this tender, show all bids in a table
            if title in all_bids and all_bids[title]:
                # Sort bids by amount (lowest first since it's usually better in tenders)
                bids = sorted(all_bids[title], key=lambda x: float(x['bid_amount']))
                
                output += f'''
                    <h6 class="mt-4">All Submitted Bids:</h6>
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>Bid Amount</th>
                                <th>Company</th>
                                <th>Contact Person</th>
                                <th>Days to Complete</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                '''
                
                for bid in bids:
                    # Determine status badge
                    status_class = 'secondary'
                    status_icon = 'clock'
                    status_text = bid['status']
                    
                    if bid['username'] == winner_data['username']:
                        status_class = 'success'
                        status_icon = 'trophy'
                        status_text = 'Winner'
                    elif bid['status'] == 'Rejected' or (title in winners and bid['username'] != winner_data['username']):
                        status_class = 'danger'
                        status_icon = 'times'
                        status_text = 'Lost'
                    
                    output += f'''
                    <tr>
                        <td>{bid['bid_amount']}</td>
                        <td>{bid['company_name']}</td>
                        <td>{bid['contact_person']}</td>
                        <td>{bid['completion_days']}</td>
                        <td><span class="badge badge-{status_class}"><i class="fas fa-{status_icon}"></i> {status_text}</span></td>
                    </tr>
                    '''
                
                output += '''
                        </tbody>
                    </table>
                '''
            
            output += '''
                </div>
            </div>
            '''
        
        # If no winners found, show empty state message
        if not found_winners:
            output = '<div class="alert alert-info">No tenders with selected winners found.</div>'
            
        context = {'data': output}
        return render(request, 'WinnerSelection.html', context)                    

def BidTenderActionPage(request):
    if request.method == 'POST':
        try:
            # Get basic form data
            title = request.POST.get('t1', '')
            amount = request.POST.get('t2', '')
            
            # Get additional form fields
            company_name = request.POST.get('companyName', '')
            contact_person = request.POST.get('contactPerson', '')
            contact_email = request.POST.get('contactEmail', '')
            contact_phone = request.POST.get('contactPhone', '')
            completion_time = request.POST.get('completionTime', '')
            proposal_details = request.POST.get('proposalDetails', '')
            experience = request.POST.get('experience', '')
            
            # Strip any unnecessary quotes or spaces
            title = title.strip().replace('"', '')
            amount = amount.strip()
            
            # Validate amount is a valid number
            try:
                float_amount = float(amount)
                if float_amount <= 0:
                    context = {'data': 'Invalid bid amount. Please enter a positive number.', 'error': True}
                    return render(request, 'BidTenderAction.html', context)
            except ValueError:
                context = {'data': 'Invalid bid amount. Please enter a valid number.', 'error': True}
                return render(request, 'BidTenderAction.html', context)
            
            # Validate completion time is a valid number
            try:
                completion_days = int(completion_time)
                if completion_days <= 0:
                    context = {'data': 'Invalid completion time. Please enter a positive number of days.', 'error': True}
                    return render(request, 'BidTenderAction.html', context)
            except ValueError:
                context = {'data': 'Invalid completion time. Please enter a valid number of days.', 'error': True}
                return render(request, 'BidTenderAction.html', context)
            
            # Get current user from session
            user = request.session.get('username')
            if not user:
                # Fallback to file-based session if not in Django session
                try:
                    with open("session.txt", "r") as file:
                        for line in file:
                            user = line.strip('\n')
                            break  # Only read the first line
                except Exception:
                    pass
            
            if not user:
                context = {'data': 'User session expired. Please log in again.', 'error': True}
                return render(request, 'BidTenderAction.html', context)
                
            # Create the bid data with all fields and encrypt it
            # Format: bidding#title#amount#user#status#company#contact_person#email#phone#completion_days#proposal_summary#experience
            data = f"bidding#{title}#{amount}#{user}#Pending#{company_name}#{contact_person}#{contact_email}#{contact_phone}#{completion_time}#{proposal_details[:200]}#{experience[:200]}"
            
            # Add to blockchain with optimized processing
            try:
                # Pre-compute encryption to improve performance
                enc = encrypt(str(data))
                enc = str(base64.b64encode(enc),'utf-8')
                
                # Add transaction first
                blockchain.add_new_transaction(enc)
                
                # Then mine and save
                hash = blockchain.mine()
                blockchain.save_object(blockchain,'blockchain_contract.txt')
                
                # Create notification for tender officers
                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                notification_data = f"notification#new_bid#{title}#{timestamp}#officer#unread"
                
                try:
                    # Encrypt and add notification to blockchain
                    enc_notification = encrypt(str(notification_data))
                    enc_notification = str(base64.b64encode(enc_notification),'utf-8')
                    blockchain.add_new_transaction(enc_notification)
                    hash = blockchain.mine()
                    blockchain.save_object(blockchain,'blockchain_contract.txt')
                    print(f"Notification created for tender officers: New bid on {title} by {user}")
                    
                    # Reset notification cache so counts update immediately
                    update_notification_cache()
                except Exception as e:
                    print(f"Error creating notification: {str(e)}")
                
                context = {
                    'data': f'Your bid for <strong>{title}</strong> has been successfully submitted.',
                    'success': True,
                    'title': title
                }
                
                # Set a session flag indicating a recent successful bid
                request.session['recent_bid'] = True
                request.session['recent_bid_title'] = title
                
            except Exception as e:
                context = {'data': f'Error submitting bid: {str(e)}', 'error': True}
                
            return render(request, 'BidTenderAction.html', context)
            
        except Exception as e:
            context = {'data': f'An unexpected error occurred: {str(e)}', 'error': True}
            return render(request, 'BidTenderAction.html', context)

def checkUser(username):
    record = 'none'
    for i in range(len(blockchain.chain)):
        if i > 0:
            b = blockchain.chain[i]
            data = b.transactions[0]
            data = base64.b64decode(data)
            data = str(decrypt(data))
            data = data[2:len(data)-1]
            print(data)
            arr = data.split("#")
            if arr[0] == "signup":
                if arr[1] == username:
                    record = "exists"
                    break
    return record

def CreateTenderAction(request):
    if request.method == 'POST':
        # Get basic tender data
        title = request.POST.get('t1', '')
        description = request.POST.get('t2', '')
        open_date = request.POST.get('t3', '')
        close_date = request.POST.get('t4', '')
        amt = request.POST.get('t5', '')
        
        # Get additional tender context fields
        industry = request.POST.get('industry', 'Not Specified')
        category = request.POST.get('category', 'Not Specified')
        location = request.POST.get('location', 'Not Specified')
        
        # Get the eligibility and specifications fields
        eligibility = request.POST.get('eligibility', 'Not Specified')
        specifications = request.POST.get('specifications', 'Not Specified')
        
        # Create data string format for blockchain
        # Format: tender#title#description#open_date#close_date#amt#industry#category#location#eligibility#specifications
        data = f"tender#{title}#{description}#{open_date}#{close_date}#{amt}#{industry}#{category}#{location}#{eligibility}#{specifications}"
        
        # Encrypt and store in blockchain
        enc = encrypt(str(data))
        enc = str(base64.b64encode(enc),'utf-8')
        blockchain.add_new_transaction(enc)
        hash = blockchain.mine()
        b = blockchain.chain[len(blockchain.chain)-1]
        print("Previous Hash : "+str(b.previous_hash)+" Block No : "+str(b.index)+" Current Hash : "+str(b.hash))
        bc = "Previous Hash : "+str(b.previous_hash)+"<br/>Block No : "+str(b.index)+"<br/>Current Hash : "+str(b.hash)
        blockchain.save_object(blockchain,'blockchain_contract.txt')
        context= {'data':'Tender Created Successfully.<br/>'+bc}
        return render(request, 'CreateTender.html', context)
        

def checkCompanyName(company_name):
    """Check if a company name already exists in the blockchain"""
    for i in range(len(blockchain.chain)):
        if i > 0:
            try:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                if arr[0] == "signup" and arr[5] == company_name:
                    return 'exists'
            except:
                pass
    return 'none'

def Signup(request):
    if request.method == 'POST':
        username = request.POST.get('username', False)
        password = request.POST.get('password', False)
        contact = request.POST.get('contact', False)
        email = request.POST.get('email', False)
        cname = request.POST.get('cname', False)
        address = request.POST.get('address', False)
        
        # Check for duplicate username
        check_username = checkUser(username)
        # Check for duplicate company name
        check_company = checkCompanyName(cname)
        
        if check_username == 'none' and check_company == 'none':
            data = "signup#"+username+"#"+password+"#"+contact+"#"+email+"#"+cname+"#"+address
            enc = encrypt(str(data))
            enc = str(base64.b64encode(enc),'utf-8')
            blockchain.add_new_transaction(enc)
            hash = blockchain.mine()
            b = blockchain.chain[len(blockchain.chain)-1]
            print("Previous Hash : "+str(b.previous_hash)+" Block No : "+str(b.index)+" Current Hash : "+str(b.hash))
            bc = "Previous Hash : "+str(b.previous_hash)+"<br/>Block No : "+str(b.index)+"<br/>Current Hash : "+str(b.hash)
            blockchain.save_object(blockchain,'blockchain_contract.txt')
            context= {'data':'Signup process completed and record saved in Blockchain with below hashcodes.<br/>'+bc}
            return render(request, 'Register.html', context)
        else:
            # Provide specific error message based on what's duplicated
            error_msg = ''
            if check_username != 'none':
                error_msg = 'Username already exists. Please choose a different username.'
            elif check_company != 'none':
                error_msg = 'Company name already exists. Please use a different company name.'
            else:
                error_msg = 'Registration failed. Please try again.'
                
            context= {'data': error_msg}
            return render(request, 'Register.html', context)


def TenderLoginAction(request):
    if request.method == 'POST':
        username = request.POST.get('username', False)
        password = request.POST.get('password', False)
        account_type = request.POST.get('account_type', 'officer')
        
        if username == 'admin' and password == 'admin':
            context= {'data':'Welcome '+username}
            return render(request, 'TenderScreen.html', context)
        else:
            context= {'data':'Invalid Login'}
            return render(request, 'Login.html', context)
            


def BidderLoginAction(request):
    if request.method == 'POST':
        username = request.POST.get('username', False)
        password = request.POST.get('password', False)
        account_type = request.POST.get('account_type', 'bidder')
        status = 'none'
        for i in range(len(blockchain.chain)):
            if i > 0:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                if arr[0] == "signup":
                    if arr[1] == username and arr[2] == password:
                        status = 'success'
                        break
        if status == 'success':
            # Store in both session and file for compatibility
            file = open('session.txt','w')
            file.write(username)
            file.close()
            request.session['username'] = username
            request.session.modified = True
            context= {'data':"Welcome "+username}
            return render(request, 'BidderScreen.html', context)
        else:
            context= {'data':'Invalid login details'}
            return render(request, 'Login.html', context)
        
        

def BidderScreen(request):
    # Basic view to render the bidder dashboard
    return render(request, 'BidderScreen.html')

def BidderNotifications(request):
    from django.utils import timezone
    import json
    current_user = ''
    try:
        current_user = request.session.get('username', '')
        if not current_user:
            with open("session.txt", "r") as file:
                for line in file:
                    current_user = line.strip('\n')
                    break
    except:
        pass

    # Mark all as read if requested
    if request.method == 'POST' and request.GET.get('mark_read') == '1':
        request.session['notifications_read'] = timezone.now().timestamp()
        request.session.modified = True
        return render(request, 'BidderNotifications.html', {'notifications': '', 'unread_count': 0})

    output = ''
    notifications_found = False
    user_bids = {}
    winner_notifications = {}
    tender_closures = {}
    notifications = []
    latest_time = 0

    # Scan blockchain for status changes related to the user's bids
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
                    bid_amount = arr[2]
                    timestamp = b.timestamp
                    if tender_title not in user_bids or timestamp > user_bids[tender_title]['timestamp']:
                        user_bids[tender_title] = {
                            'amount': bid_amount,
                            'timestamp': timestamp
                        }
                # Store winner notifications
                elif arr[0] == "winner":
                    tender_title = arr[1]
                    winner = arr[4]
                    timestamp = b.timestamp
                    if tender_title in user_bids or winner == current_user:
                        winner_notifications[tender_title] = {
                            'winner': winner,
                            'timestamp': timestamp,
                            'amount': arr[2]
                        }
                # Store tender information for closure detection
                elif arr[0] == "tender":
                    tender_title = arr[1]
                    close_date = arr[4]
                    close_dt = None
                    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%Y/%m/%d"):
                        try:
                            close_dt = datetime.strptime(close_date, fmt)
                            break
                        except:
                            continue
                    if close_dt and close_dt < datetime.now():
                        tender_closures[tender_title] = {
                            'close_date': close_date,
                            'close_dt': close_dt
                        }
            except Exception as e:
                pass

    # Winner notifications
    for title, data in winner_notifications.items():
        is_winner = data['winner'] == current_user
        notifications.append({
            'title': "Congratulations! You won the tender!" if is_winner else "Tender result announced",
            'message': f"Your bid for '{title}' has been selected as the winning bid!" if is_winner else f"The tender '{title}' has been awarded to {data['winner']}",
            'timestamp': data['timestamp'],
            'type': 'success' if is_winner else 'info',
            'icon': 'trophy' if is_winner else 'award'
        })
        if data['timestamp'] > latest_time:
            latest_time = data['timestamp']
    # Tender closure notifications
    for title, closure in tender_closures.items():
        if title in user_bids and title not in winner_notifications:
            notifications.append({
                'title': "Tender closed",
                'message': f"The tender '{title}' has closed without a winner selection.",
                'timestamp': closure['close_dt'].timestamp(),
                'type': 'warning',
                'icon': 'lock'
            })
            if closure['close_dt'].timestamp() > latest_time:
                latest_time = closure['close_dt'].timestamp()
    notifications.sort(key=lambda x: x['timestamp'], reverse=True)

    # Unread logic
    notifications_read = request.session.get('notifications_read', 0)
    unread_count = 0
    output = ''
    if notifications:
        notifications_found = True
        for notif in notifications:
            is_unread = notif['timestamp'] > notifications_read
            if is_unread:
                unread_count += 1
            try:
                timestamp = datetime.fromtimestamp(notif['timestamp'])
                formatted_time = timestamp.strftime("%d %b %Y, %H:%M")
            except:
                formatted_time = "Recently"
            output += f'''
            <li class="notification-item{' unread' if is_unread else ''}">
                <div class="notification-icon {notif['type']}">
                    <i class="fas fa-{notif['icon']}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">{notif['title']}</div>
                    <div class="notification-text">{notif['message']}</div>
                    <div class="notification-time">{formatted_time}</div>
                </div>
            </li>'''
    context = {
        'notifications': output if notifications_found else '',
        'unread_count': unread_count
    }
    return render(request, 'BidderNotifications.html', context)

            
