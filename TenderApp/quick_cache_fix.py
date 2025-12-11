"""
Quick fix for the _blockchain_cache KeyError in TrustChain application

This script will directly patch the views.py file to prevent the KeyError
by ensuring the _blockchain_cache dictionary is properly initialized.

Run this script from the TrustChain directory:
  python TenderApp/quick_cache_fix.py
"""

def fix_blockchain_cache():
    """Add initialization code to fix the KeyError: 'cache_misses' issue"""
    try:
        # First, read the original file
        with open('TenderApp/views.py', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Find the cache initialization block
        cache_init_block = "_blockchain_cache = {"
        init_pos = content.find(cache_init_block)
        
        if init_pos == -1:
            print("Error: Could not find _blockchain_cache initialization in views.py")
            return False
            
        # Create a new initialization code that ensures all required keys exist
        # We'll insert this right after the imports
        cache_init_code = """
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
"""

        # Find a good insertion point (right after imports)
        import_section = content.find("from django.shortcuts import render")
        if import_section == -1:
            import_section = content.find("import os")
            
        if import_section == -1:
            # If we can't find common imports, insert near the top
            insertion_point = 30
        else:
            # Find the end of the import section
            next_line_break = content.find("\n\n", import_section)
            if next_line_break == -1:
                next_line_break = content.find("\n", import_section)
            insertion_point = next_line_break + 1
            
        # Insert our initialization code
        new_content = content[:insertion_point] + cache_init_code + content[insertion_point:]
        
        # Fix the get_cached_tenders function to handle missing keys
        get_cached_tenders_func = "def get_cached_tenders(current_user):"
        func_pos = new_content.find(get_cached_tenders_func)
        
        if func_pos != -1:
            # Find where to insert our safety check
            func_body_start = new_content.find(":", func_pos) + 1
            func_body_start = new_content.find("\n", func_body_start) + 1
            
            # Add safety check code
            safety_code = """
    # Ensure required cache keys exist
    if 'cache_misses' not in _blockchain_cache:
        _blockchain_cache['cache_misses'] = 0
    if 'cache_hits' not in _blockchain_cache:
        _blockchain_cache['cache_hits'] = 0
    if 'tender_data' not in _blockchain_cache:
        _blockchain_cache['tender_data'] = {}
        
"""
            new_content = new_content[:func_body_start] + safety_code + new_content[func_body_start:]
        
        # Backup the original file
        import shutil
        from datetime import datetime
        backup_path = f"TenderApp/views_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"
        shutil.copy2('TenderApp/views.py', backup_path)
        print(f"Original file backed up to {backup_path}")
        
        # Write the updated content
        with open('TenderApp/views.py', 'w', encoding='utf-8') as f:
            f.write(new_content)
            
        print("Fix applied successfully!")
        print("Please restart your Django server for the changes to take effect.")
        return True
        
    except Exception as e:
        print(f"Error applying fix: {str(e)}")
        return False

if __name__ == "__main__":
    print("Applying quick fix for _blockchain_cache KeyError issue...")
    if fix_blockchain_cache():
        print("✅ Fix completed successfully!")
    else:
        print("❌ Failed to apply fix.")
