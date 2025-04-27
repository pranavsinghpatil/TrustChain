import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
import json
import requests
from datetime import datetime
import os
from web3 import Web3
from web3.contract import Contract

class NotificationManager:
    """Manages notifications for the tender management system"""
    
    def __init__(
        self,
        smtp_host: str,
        smtp_port: int,
        smtp_username: str,
        smtp_password: str,
        firebase_key: Optional[str] = None
    ):
        """Initialize notification manager"""
        self.smtp_config = {
            'host': smtp_host,
            'port': smtp_port,
            'username': smtp_username,
            'password': smtp_password
        }
        self.firebase_key = firebase_key
        self._smtp_connection = None
        
    def _get_smtp_connection(self):
        """Get or create SMTP connection"""
        if self._smtp_connection is None:
            self._smtp_connection = smtplib.SMTP(
                self.smtp_config['host'],
                self.smtp_config['port']
            )
            self._smtp_connection.starttls()
            self._smtp_connection.login(
                self.smtp_config['username'],
                self.smtp_config['password']
            )
        return self._smtp_connection
        
    def send_email(
        self,
        to_address: str,
        subject: str,
        body: str,
        is_html: bool = False
    ) -> bool:
        """Send email notification"""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_config['username']
            msg['To'] = to_address
            
            content_type = 'html' if is_html else 'plain'
            msg.attach(MIMEText(body, content_type))
            
            smtp = self._get_smtp_connection()
            smtp.send_message(msg)
            return True
            
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            return False
            
    def send_push_notification(
        self,
        device_token: str,
        title: str,
        message: str,
        data: Optional[Dict] = None
    ) -> bool:
        """Send push notification using Firebase"""
        if not self.firebase_key:
            raise ValueError("Firebase key not configured")
            
        try:
            headers = {
                'Authorization': f'key={self.firebase_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'to': device_token,
                'notification': {
                    'title': title,
                    'body': message,
                    'sound': 'default'
                }
            }
            
            if data:
                payload['data'] = data
                
            response = requests.post(
                'https://fcm.googleapis.com/fcm/send',
                headers=headers,
                data=json.dumps(payload)
            )
            
            return response.status_code == 200
            
        except Exception as e:
            print(f"Failed to send push notification: {str(e)}")
            return False
            
    def notify_new_tender(
        self,
        tender_id: int,
        tender_info: Dict,
        subscribers: List[Dict]
    ) -> None:
        """Notify subscribers about new tender"""
        subject = f"New Tender Available: {tender_info['title']}"
        
        email_body = f"""
        A new tender has been created:
        
        Title: {tender_info['title']}
        Description: {tender_info['description']}
        Deadline: {datetime.fromtimestamp(tender_info['deadline'])}
        Minimum Bid: {Web3.from_wei(tender_info['minBid'], 'ether')} ETH
        
        View tender details and submit your bid at:
        {os.getenv('APP_URL', 'http://localhost:3000')}/tenders/{tender_id}
        """
        
        push_message = f"New tender: {tender_info['title']}"
        
        for subscriber in subscribers:
            if subscriber.get('email'):
                self.send_email(
                    subscriber['email'],
                    subject,
                    email_body
                )
                
            if subscriber.get('device_token'):
                self.send_push_notification(
                    subscriber['device_token'],
                    "New Tender Alert",
                    push_message,
                    {
                        'tender_id': str(tender_id),
                        'type': 'new_tender'
                    }
                )
                
    def notify_bid_received(
        self,
        tender_id: int,
        bid_info: Dict,
        tender_owner: str
    ) -> None:
        """Notify tender owner about new bid"""
        subject = f"New Bid Received for Tender #{tender_id}"
        
        email_body = f"""
        A new bid has been submitted for your tender:
        
        Tender ID: {tender_id}
        Bid Amount: {Web3.from_wei(bid_info['bidAmount'], 'ether')} ETH
        Bidder: {bid_info['bidderAddress']}
        Timestamp: {datetime.fromtimestamp(bid_info['timestamp'])}
        
        View bid details at:
        {os.getenv('APP_URL', 'http://localhost:3000')}/tenders/{tender_id}/bids
        """
        
        self.send_email(
            tender_owner,
            subject,
            email_body
        )
        
    def notify_tender_closed(
        self,
        tender_id: int,
        winner_address: str,
        all_bidders: List[str]
    ) -> None:
        """Notify winner and other bidders about tender closure"""
        for bidder in all_bidders:
            is_winner = bidder == winner_address
            subject = f"Tender #{tender_id} - {'Won' if is_winner else 'Closed'}"
            
            email_body = f"""
            The tender has been closed.
            {'Congratulations! Your bid has been selected as the winner.' if is_winner else 'Thank you for participating.'}
            
            View tender details at:
            {os.getenv('APP_URL', 'http://localhost:3000')}/tenders/{tender_id}
            """
            
            self.send_email(
                bidder,
                subject,
                email_body
            )
            
    def close(self):
        """Close SMTP connection"""
        if self._smtp_connection:
            self._smtp_connection.quit()
            self._smtp_connection = None 