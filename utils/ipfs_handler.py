import ipfshttpclient
import json
import os
from typing import Dict, Optional, List
from datetime import datetime

class IPFSDocumentHandler:
    """Handler for storing and retrieving tender documents on IPFS"""
    
    def __init__(self, ipfs_host: str = '/ip4/127.0.0.1/tcp/5001'):
        """Initialize IPFS client"""
        self.ipfs_host = ipfs_host
        self._client = None
        self.document_index: Dict[str, Dict] = {}
    
    @property
    def client(self):
        """Lazy initialization of IPFS client"""
        if self._client is None:
            self._client = ipfshttpclient.connect(self.ipfs_host)
        return self._client

    def upload_tender_document(self, tender_id: int, file_path: str, document_type: str) -> Dict:
        """
        Upload a tender document to IPFS
        
        Args:
            tender_id: The ID of the tender
            file_path: Path to the document file
            document_type: Type of document (e.g., 'technical', 'financial', 'terms')
            
        Returns:
            Dict containing IPFS hash and metadata
        """
        try:
            # Read file and upload to IPFS
            with open(file_path, 'rb') as f:
                ipfs_info = self.client.add(f)
            
            # Create metadata
            metadata = {
                'tender_id': tender_id,
                'document_type': document_type,
                'ipfs_hash': ipfs_info['Hash'],
                'timestamp': datetime.utcnow().isoformat(),
                'original_filename': os.path.basename(file_path)
            }
            
            # Store in document index
            doc_key = f"{tender_id}_{document_type}"
            self.document_index[doc_key] = metadata
            
            return metadata
            
        except Exception as e:
            raise Exception(f"Failed to upload document: {str(e)}")

    def get_tender_document(self, ipfs_hash: str, output_path: str) -> bool:
        """
        Retrieve a document from IPFS
        
        Args:
            ipfs_hash: IPFS hash of the document
            output_path: Where to save the retrieved document
            
        Returns:
            bool indicating success
        """
        try:
            self.client.get(ipfs_hash)
            # Move file from IPFS hash name to desired output path
            os.rename(ipfs_hash, output_path)
            return True
        except Exception as e:
            raise Exception(f"Failed to retrieve document: {str(e)}")

    def get_tender_documents(self, tender_id: int) -> List[Dict]:
        """Get all documents associated with a tender"""
        return [
            doc for doc in self.document_index.values()
            if doc['tender_id'] == tender_id
        ]

    def verify_document_hash(self, file_path: str, ipfs_hash: str) -> bool:
        """Verify if a local file matches its IPFS hash"""
        try:
            with open(file_path, 'rb') as f:
                new_hash = self.client.add(f, only_hash=True)['Hash']
            return new_hash == ipfs_hash
        except Exception as e:
            raise Exception(f"Failed to verify document: {str(e)}")

    def close(self):
        """Close IPFS client connection"""
        if self._client:
            self._client.close()
            self._client = None 