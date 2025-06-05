# Tender Management System - Project Generation Prompt

## Project Overview

Generate a decentralized tender management system that leverages blockchain technology for secure and transparent tender processes. The system should be built using React, TypeScript, and Ethereum smart contracts.

## Core Features

1. **User Management**
   - Multi-level user hierarchy (Admin, Officers, Bidders)
   - Secure authentication system
   - Password management with default credentials
   - Role-based permissions

2. **Tender Management**
   - Create and manage tender documents
   - Set deadlines and budgets
   - Document upload and storage (IPFS integration)
   - Approval workflows

3. **Blockchain Integration**
   - Smart contracts for tender management
   - Officer management system
   - Secure transaction handling
   - Gas optimization

## Technical Requirements

1. **Frontend**
   - React 18+
   - TypeScript
   - Tailwind CSS for styling
   - Redux Toolkit for state management
   - React Router for navigation

2. **Blockchain**
   - Ethereum smart contracts
   - Hardhat for development
   - Ethers.js for web3 interactions
   - MetaMask integration
   - IPFS for document storage

3. **Security**
   - Secure password handling
   - Role-based access control
   - Transaction validation
   - Error handling and recovery

## User Roles and Permissions

1. **Admin**
   - Username: 'admin'
   - Default password: 'admin00'
   - Full system access
   - Can create and manage officers

2. **Officers**
   - Default password: 'tender00'
   - Can create and manage tenders
   - Document upload capabilities
   - Approval permissions

3. **Bidders**
   - Can view tenders
   - Can submit bids
   - Document submission

## Key Components

1. **AuthContext**
   - User authentication
   - Password management
   - Session handling
   - Officer synchronization

2. **Web3Context**
   - Blockchain interactions
   - Smart contract management
   - Transaction handling
   - Gas estimation

3. **Tender Management**
   - Tender creation
   - Document handling
   - Approval workflows
   - Deadline management

## Error Handling and Recovery

1. **Transaction Errors**
   - Gas estimation
   - Fallback mechanisms
   - Error recovery
   - User-friendly error messages

2. **Data Validation**
   - Input validation
   - Data integrity checks
   - Fallback data handling
   - Error logging

## Design Principles

1. **Scalability**
   - Modular architecture
   - Component-based design
   - Clean separation of concerns

2. **Security**
   - Secure authentication
   - Data encryption
   - Access control
   - Transaction validation

3. **User Experience**
   - Intuitive interface
   - Clear error messages
   - Responsive design
   - Loading states

## Development Guidelines

1. **Code Structure**
   - Clear separation of concerns
   - Consistent naming conventions
   - Proper error handling
   - Comprehensive logging

2. **Testing**
   - Unit tests for components
   - Integration tests for smart contracts
   - End-to-end testing
   - Security testing

3. **Documentation**
   - Code comments
   - API documentation
   - User guides
   - Deployment instructions

## Deployment Requirements

1. **Smart Contracts**
   - Deployment scripts
   - Configuration management
   - Network support

2. **Frontend**
   - Build optimization
   - Environment configuration
   - Deployment automation

3. **Infrastructure**
   - IPFS node configuration
   - Network connectivity
   - Security setup

## Future Enhancements

1. **Additional Features**
   - Advanced search capabilities
   - Analytics dashboard
   - Mobile responsiveness
   - Multi-language support

2. **Technical Improvements**
   - Performance optimization
   - Security enhancements
   - User experience improvements
   - Additional integrations

This prompt should be used as a comprehensive guide for generating a complete tender management system with all necessary features, security considerations, and best practices.
