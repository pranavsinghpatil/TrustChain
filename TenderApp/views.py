from django.shortcuts import render
from django.template import RequestContext
from django.contrib import messages
from django.http import HttpResponse
from django.core.files.storage import FileSystemStorage
import os
from Blockchain import *
from Block import *
from datetime import date
import pyaes, pbkdf2, binascii, os, secrets
import base64
import numpy as np
from django.shortcuts import render

blockchain = Blockchain()
if os.path.exists('blockchain_contract.txt'):
    with open('blockchain_contract.txt', 'rb') as fileinput:
        blockchain = pickle.load(fileinput)
    fileinput.close()

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

def index(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})
    
def Logout(request):
    if request.method == 'GET':
       return render(request, 'index.html', {})        

def TenderLogin(request):
    if request.method == 'GET':
       return render(request, 'TenderLogin.html', {})

def BidderLogin(request):
    if request.method == 'GET':
       return render(request, 'BidderLogin.html', {})    
    
def Register(request):
    if request.method == 'GET':
       return render(request, 'Register.html', {})

def BidTenderAction(request):
    if request.method == 'GET':
        title = request.GET.get('title', False)
        print(title+"================")
        output = '<TR><TH align="left"><font size="" color="white">Tender&nbsp;Title<TD>&nbsp;&nbsp;<Input type=text name="t1" value='+title+'></TD></TR>'
        context= {'data1':output}
        return render(request, 'BidTenderAction.html', context)
        
        
def BidTender(request):
    if request.method == 'GET':
        color = '<font size="" color="white">'
        output='<table border=1 align=center>'
        output+='<tr><th>'+color+'Tender Title</th><th>'+color+'Tender Description</th><th>'+color+'Open Date</th><th>'+color+'Close Date</th><th>'+color+'Amount</th><th>'+color+'Bid Now</th></tr>'
        current = datetime.now()
        current = int(round(current.timestamp()))
        for i in range(len(blockchain.chain)):
            if i > 0:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                print(data)
                arr = data.split("#")
                # print(arr[0])
                # print(arr[1])
                if arr[0] == "tender" and getWinner(arr[1]) == 'none':
                    open_date = arr[3]
                    close_date = arr[4]
                    # print(close_date)
                    open_date = datetime.strptime(open_date, "%d-%m-%Y")
                    close_date = datetime.strptime(close_date, "%d-%m-%Y")
                    open_date = int(round(open_date.timestamp()))
                    close_date = int(round(close_date.timestamp()))
                   
                    if current <= open_date and current <= close_date and getWinner(arr[1]) == "none":
                        print("scxxxxxxxxxxxxx")
                        output+='<tr><td>'+color+arr[1]+'</td><td>'+color+arr[2]+'</td><td>'+color+arr[3]+'</td><td>'+color+arr[4]+'</td><td>'+color+arr[5]+'</td>'
                        output+='<td><a href=\'BidTenderAction?title="'+str(arr[1])+'"\'>'+color+'Click Here</font></a></td>'
                    
        context= {'data':output}
        return render(request, 'BidTender.html', context)


def ViewTender(request):
    if request.method == 'GET':
        color = '<font size="" color="white">'
        output='<table border=1 align=center>'
        output+='<tr><th><font size="" color="white">Tender Title</th><th><font size="" color="white">Amount</th><th><font size="" color="white">Username</th><th><font size="" color="white">Tender Status</th></tr>'
        color = '<font size="" color="white">'
        for i in range(len(blockchain.chain)):
            if i > 0:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                print(data)
                arr = data.split("#")
                if arr[0] == "bidding":
                    output+='<tr><td>'+color+arr[1]+'</td><td>'+color+arr[2]+'</td><td>'+color+arr[3]+'</td><td>'+color+getWinners(arr[1],arr[3])+'</td>'
                    
        context= {'data':output}
        return render(request, 'ViewTender.html', context)

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
    output = 'Lost'
    for i in range(len(blockchain.chain)):
        if i > 0:
            b = blockchain.chain[i]
            data = b.transactions[0]
            data = base64.b64decode(data)
            data = str(decrypt(data))
            data = data[2:len(data)-1]
            arr = data.split("#")
            if arr[0] == "winner" and arr[1] == title and arr[4] == bidder:
                output = "Winner"
                break
    return output

def EvaluateTender(request):
    if request.method == 'GET':
        color = '<font size="" color="white">'
        output='<table border=1 align=center>'
        output+='<tr><th><font size="" color="white">Tender Title</th><th><font size="" color="white">Amount</th><th><font size="" color="white">Username</th><th><font size="" color="white">Winner Name</th></tr>'
        color = '<font size="" color="white">'
        titles = []
        for i in range(len(blockchain.chain)):
            if i > 0:
                b = blockchain.chain[i]
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                arr = data.split("#")
                print("lakshmi")
                if arr[0] == "bidding" and arr[4] == "Pending":
                    titles.append(arr[1])
                    print("vamsi")

        for k in range(len(titles)):
            selected = 'none'
            initial = 0
            for i in range(len(blockchain.chain)):
                if i > 0:
                    b = blockchain.chain[i]
                    data = b.transactions[0]
                    data = base64.b64decode(data)
                    data = str(decrypt(data))
                    data = data[2:len(data)-1]
                    arr = data.split("#")
                    if arr[0] == "bidding" and arr[4] == "Pending" and arr[1] == titles[k]:
                        print("siri")
                        print(arr[2])
                        if float(arr[2]) > initial:
                            initial = float(arr[2])
                            selected = arr[3]
                            print(selected)
            if selected != 'none':
                for i in range(len(blockchain.chain)):
                    if i > 0:
                        b = blockchain.chain[i]
                        data = b.transactions[0]
                        data = base64.b64decode(data)
                        data = str(decrypt(data))
                        data = data[2:len(data)-1]
                        arr = data.split("#")
                        print(arr)
                        if arr[0] == "bidding" and arr[4] == "Pending" and arr[1] == titles[k] and getWinner(arr[1]) == 'none':
                            data = "winner#"+arr[1]+"#"+arr[2]+"#"+arr[3]+"#"+selected
                            enc = encrypt(str(data))
                            enc = str(base64.b64encode(enc),'utf-8')
                            blockchain.add_new_transaction(enc)
                            hash = blockchain.mine()
                            blockchain.save_object(blockchain,'blockchain_contract.txt')
                
        context= {'data':'Evaluation Process Completed'}
        return render(request, 'EvaluateTender.html', context)                                    
                    
       

def WinnerSelection(request):
    if request.method == 'GET':
        color = '<font size="" color="white">'
        output='<table border=1 align=center>'
        output+='<tr><th><font size="" color="white">Tender Title</th><th><font size="" color="white">Amount</th><th><font size="" color="white">Username</th><th><font size="" color="white">Win Status</th></tr>'
        color = '<font size="" color="white">'
        for i in range(len(blockchain.chain)):
            if i > 0:
                b = blockchain.chain[i]
                print(b)
                data = b.transactions[0]
                data = base64.b64decode(data)
                data = str(decrypt(data))
                data = data[2:len(data)-1]
                print(data)
                arr = data.split("#")
                if arr[0] == "bidding":
                    output+='<tr><td>'+color+arr[1]+'</td><td>'+color+arr[2]+'</td><td>'+color+arr[3]+'</td><td>'+color+getWinners(arr[1],arr[3])+'</td>'
        context= {'data':output}
        return render(request, 'WinnerSelection.html', context)                    

def BidTenderActionPage(request):
    if request.method == 'POST':
        title = request.POST.get('t1', False)
        amt = request.POST.get('t2', False)
        user = ''
        with open("session.txt", "r") as file:
          for line in file:
              user = line.strip('\n')
        file.close()
        data = "bidding#"+title+"#"+amt+"#"+user+"#Pending"
        enc = encrypt(str(data))
        enc = str(base64.b64encode(enc),'utf-8')
        blockchain.add_new_transaction(enc)
        hash = blockchain.mine()
        b = blockchain.chain[len(blockchain.chain)-1]
        print("Previous Hash : "+str(b.previous_hash)+" Block No : "+str(b.index)+" Current Hash : "+str(b.hash))
        bc = "Previous Hash : "+str(b.previous_hash)+"<br/>Block No : "+str(b.index)+"<br/>Current Hash : "+str(b.hash)
        blockchain.save_object(blockchain,'blockchain_contract.txt')
        context= {'data':'Bidding Submitted Successfully.<br/>'+bc}
        return render(request, 'BidderScreen.html', context)
              

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
        title = request.POST.get('t1', False)
        description = request.POST.get('t2', False)
        open_date = request.POST.get('t3', False)
        close_date = request.POST.get('t4', False)
        amt = request.POST.get('t5', False)
        data = "tender#"+title+"#"+description+"#"+open_date+"#"+close_date+"#"+amt
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
        

def Signup(request):
    if request.method == 'POST':
        username = request.POST.get('username', False)
        password = request.POST.get('password', False)
        contact = request.POST.get('contact', False)
        email = request.POST.get('email', False)
        cname = request.POST.get('cname', False)
        address = request.POST.get('address', False)
        check = checkUser(username)
        if check == 'none':
            data = "signup#"+username+"#"+password+"#"+contact+"#"+email+"#"+cname+"#"+address
            enc = encrypt(str(data))
            enc = str(base64.b64encode(enc),'utf-8')
            blockchain.add_new_transaction(enc)
            hash = blockchain.mine()
            b = blockchain.chain[len(blockchain.chain)-1]
            print("Previous Hash : "+str(b.previous_hash)+" Block No : "+str(b.index)+" Current Hash : "+str(b.hash))
            bc = "Previous Hash : "+str(b.previous_hash)+"<br/>Block No : "+str(b.index)+"<br/>Current Hash : "+str(b.hash)
            blockchain.save_object(blockchain,'blockchain_contract.txt')
            context= {'data':'Signup process completd and record saved in Blockchain with below hashcodes.<br/>'+bc}
            return render(request, 'Register.html', context)
        else:
            context= {'data':'Username already exists'}
            return render(request, 'Register.html', context)


def TenderLoginAction(request):
    if request.method == 'POST':
        username = request.POST.get('username', False)
        password = request.POST.get('password', False)
        if username == 'admin' and password == 'admin':
            context= {'data':'Welcome '+username}
            return render(request, 'TenderScreen.html', context)
        else:
            context= {'data':'Invalid Login'}
            return render(request, 'TenderLogin.html', context)
            


def BidderLoginAction(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        
        if not username or not password:
            context = {'data': 'Please enter both username and password'}
            return render(request, 'BidderLogin.html', context)
            
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
            # Use Django's session management
            request.session['bidder_username'] = username
            request.session['is_bidder'] = True
            context = {'data': f'Welcome {username}'}
            return render(request, 'BidderScreen.html', context)
        else:
            context = {'data': 'Invalid login details'}
            return render(request, 'BidderLogin.html', context)
        
        

        
            
