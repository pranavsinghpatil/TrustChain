import React from 'react';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { Github, Linkedin, Mail, Globe, Twitter } from 'lucide-react';

const About = () => {
  const teamMembers = [
    {
      name: "Alex Johnson",
      role: "Lead Blockchain Developer",
      bio: "Blockchain enthusiast specializing in Ethereum smart contracts and Web3 integration.",
      image: "/team/alex.jpg",
      social: {
        github: "https://github.com/alexjohnson",
        linkedin: "https://linkedin.com/in/alexjohnson",
        email: "alex@trustchain.io"
      }
    },
    {
      name: "Sophia Chen",
      role: "Frontend Developer",
      bio: "React expert focused on creating intuitive and responsive user interfaces.",
      image: "/team/sophia.jpg",
      social: {
        github: "https://github.com/sophiachen",
        linkedin: "https://linkedin.com/in/sophiachen",
        email: "sophia@trustchain.io"
      }
    },
    {
      name: "Raj Patel",
      role: "Backend Developer",
      bio: "Specializes in secure API development and database architecture.",
      image: "/team/raj.jpg",
      social: {
        github: "https://github.com/rajpatel",
        linkedin: "https://linkedin.com/in/rajpatel",
        email: "raj@trustchain.io"
      }
    },
    {
      name: "Emma Williams",
      role: "Project Manager",
      bio: "Oversees project development and ensures timely delivery of features.",
      image: "/team/emma.jpg",
      social: {
        github: "https://github.com/emmawilliams",
        linkedin: "https://linkedin.com/in/emmawilliams",
        email: "emma@trustchain.io"
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 overflow-hidden">
      <div className="absolute inset-0 bg-[url('/blockchain-pattern.svg')] opacity-10 bg-repeat"></div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Header */}
        <div className="mb-20 text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            About TrustChain
          </h1>
        </div>

        {/* Introduction */}
        <div className="max-w-4xl mx-auto mb-24">
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={8}
            blurStrength={12}
          >
            TrustChain is revolutionizing the tender management process through blockchain technology, 
            ensuring transparency, security, and efficiency in public and private sector bidding.
            We provide a decentralized platform for managing tenders and bids, leveraging smart 
            contracts to ensure fairness and eliminate fraud in the bidding process.
          </ScrollReveal>
        </div>

        {/* Our Mission */}
        <div className="max-w-4xl mx-auto mb-24">
          <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
            Our Mission
          </h2>
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={-5}
            blurStrength={8}
          >
            At TrustChain, we're on a mission to transform the traditional tendering process by eliminating corruption, 
            favoritism, and document tampering through blockchain technology. As final year Computer Science students 
            at Imperial College London, we've developed this platform to address real-world problems in government and 
            corporate procurement systems.
          </ScrollReveal>
        </div>

        {/* Our Values */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Our Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={3}
              blurStrength={6}
            >
              <h3 className="text-2xl font-semibold mb-3 text-blue-400">Transparency</h3>
              We believe in complete visibility throughout the tendering process, where all stakeholders can verify actions taken on the blockchain.
            </ScrollReveal>
            
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={-3}
              blurStrength={6}
            >
              <h3 className="text-2xl font-semibold mb-3 text-green-400">Security</h3>
              Our blockchain infrastructure ensures that all data is immutable and cryptographically secure, preventing tampering and unauthorized access.
            </ScrollReveal>
            
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={4}
              blurStrength={6}
            >
              <h3 className="text-2xl font-semibold mb-3 text-purple-400">Innovation</h3>
              We constantly explore cutting-edge technologies to improve the tender management experience and solve complex problems.
            </ScrollReveal>
            
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={-4}
              blurStrength={6}
            >
              <h3 className="text-2xl font-semibold mb-3 text-amber-400">Fairness</h3>
              Our smart contracts enforce predefined criteria for winner selection, eliminating human bias and ensuring a level playing field for all vendors.
            </ScrollReveal>
          </div>
        </div>

        {/* Technology Stack */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Our Technology
          </h2>
          <div className="max-w-4xl mx-auto">
            <ScrollReveal
              baseOpacity={0}
              enableBlur={true}
              baseRotation={2}
              blurStrength={5}
            >
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2 text-xl">•</span>
                  <span><strong className="text-blue-300">Ethereum Blockchain:</strong> For secure, transparent smart contract execution</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2 text-xl">•</span>
                  <span><strong className="text-blue-300">IPFS:</strong> For decentralized document storage and integrity verification</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2 text-xl">•</span>
                  <span><strong className="text-blue-300">React & Next.js:</strong> For building our responsive, modern frontend interface</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2 text-xl">•</span>
                  <span><strong className="text-blue-300">Solidity:</strong> For developing secure and efficient smart contracts</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-400 mr-2 text-xl">•</span>
                  <span><strong className="text-blue-300">MetaMask Integration:</strong> For seamless wallet connectivity and transaction signing</span>
                </li>
              </ul>
            </ScrollReveal>
          </div>
        </div>

        {/* Meet The Team */}
        <div className="mb-24">
          <h2 className="text-4xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            Meet Our Team
          </h2>
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={1}
            blurStrength={4}
            containerClassName="mb-12"
            textClassName="text-center max-w-3xl mx-auto"
          >
            We are final year Computer Science students at Imperial College London, passionate about blockchain technology and its potential to transform traditional systems.
          </ScrollReveal>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <ScrollReveal
                key={index}
                baseOpacity={0}
                enableBlur={true}
                baseRotation={index % 2 === 0 ? 3 : -3}
                blurStrength={7}
              >
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 border border-slate-700/50">
                  <div className="w-full h-48 relative bg-gray-700/50">
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <span className="text-4xl">👤</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-blue-400 mb-2">{member.role}</p>
                    <p className="text-sm mb-4">{member.bio}</p>
                    <div className="flex space-x-3">
                      <a href={member.social.github} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                        <Github size={18} />
                      </a>
                      <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                        <Linkedin size={18} />
                      </a>
                      <a href={`mailto:${member.social.email}`} className="text-gray-400 hover:text-white">
                        <Mail size={18} />
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>

        {/* Project Recognition */}
        <div className="mb-24 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-500">
            Project Recognition
          </h2>
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={-2}
            blurStrength={6}
          >
            TrustChain is a final year project developed at Imperial College London's Department of Computing. 
            Our project has been recognized for its innovative approach to solving real-world problems in tender management 
            through blockchain technology. We're proud to be at the forefront of applying decentralized solutions to 
            government and corporate procurement systems.
          </ScrollReveal>
        </div>

        {/* Contact & Social */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold mb-10 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-green-500">
            Connect With Us
          </h2>
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={0}
            blurStrength={5}
            containerClassName="mb-12"
          >
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              <a href="https://github.com/trustchain-project" target="_blank" rel="noopener noreferrer" 
                className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-sm rounded-full hover:bg-slate-700/70 transition-colors border border-slate-700/50">
                <Github size={20} />
                <span>GitHub</span>
              </a>
              <a href="https://twitter.com/trustchain_io" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-sm rounded-full hover:bg-slate-700/70 transition-colors border border-slate-700/50">
                <Twitter size={20} />
                <span>Twitter</span>
              </a>
              <a href="https://trustchain.io" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-sm rounded-full hover:bg-slate-700/70 transition-colors border border-slate-700/50">
                <Globe size={20} />
                <span>Website</span>
              </a>
              <a href="mailto:team@trustchain.io"
                className="flex items-center gap-2 px-6 py-3 bg-slate-800/50 backdrop-blur-sm rounded-full hover:bg-slate-700/70 transition-colors border border-slate-700/50">
                <Mail size={20} />
                <span>Email Us</span>
              </a>
            </div>
          </ScrollReveal>
          
          <ScrollReveal
            baseOpacity={0}
            enableBlur={true}
            baseRotation={1}
            blurStrength={3}
          >
            <div className="text-center text-sm text-gray-400">
              <p>© {new Date().getFullYear()} TrustChain | Imperial College London | Department of Computing</p>
              <p className="mt-2">Built with ❤️ by final year students to revolutionize tender management systems.</p>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default About;