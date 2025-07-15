import React, { useState } from 'react';
import HomePageProposal1 from './HomePageProposal1';
import HomePageProposal2 from './HomePageProposal2';
import HomePageProposal3 from './HomePageProposal3';

type ProposalType = 'proposal1' | 'proposal2' | 'proposal3';

interface Proposal {
  id: ProposalType;
  name: string;
  description: string;
  features: string[];
  color: string;
}

const HomePageShowcase: React.FC = () => {
  const [selectedProposal, setSelectedProposal] = useState<ProposalType>('proposal1');

  const proposals: Proposal[] = [
    {
      id: 'proposal1',
      name: 'Project Dashboard',
      description: 'Focuses on project management with recent projects, stats, and quick actions',
      features: [
        'Recent projects grid with thumbnails',
        'Project statistics dashboard',
        'Quick action buttons',
        'Project status tracking',
        'Clean, professional layout'
      ],
      color: '#ec4899'
    },
    {
      id: 'proposal2',
      name: 'Tool-Centered Hub',
      description: 'Emphasizes available tools with detailed information and interactive selection',
      features: [
        'Interactive tool selection',
        'Detailed tool information sidebar',
        'Feature highlights',
        'Coming soon indicators',
        'Hero section with benefits'
      ],
      color: '#3b82f6'
    },
    {
      id: 'proposal3',
      name: 'Workflow Guide',
      description: 'Guides users through step-by-step workflows for different content creation paths',
      features: [
        'Step-by-step workflow visualization',
        'Workflow selector',
        'Time estimates',
        'Visual progress indicators',
        'Guided user experience'
      ],
      color: '#10b981'
    }
  ];

  const renderProposal = () => {
    switch (selectedProposal) {
      case 'proposal1':
        return <HomePageProposal1 />;
      case 'proposal2':
        return <HomePageProposal2 />;
      case 'proposal3':
        return <HomePageProposal3 />;
      default:
        return <HomePageProposal1 />;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0a0b',
      color: 'white',
      fontFamily: '"Space Mono", monospace'
    }}>
      {/* Proposal Selector */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        backgroundColor: '#1a1a1b',
        border: '1px solid #343536',
        borderRadius: '12px',
        padding: '16px',
        minWidth: '300px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#ffffff',
          margin: '0 0 12px 0'
        }}>
          🎨 Design Proposals
        </h3>
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {proposals.map((proposal) => (
            <div key={proposal.id}>
              <button
                onClick={() => setSelectedProposal(proposal.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: selectedProposal === proposal.id ? `${proposal.color}20` : 'transparent',
                  border: selectedProposal === proposal.id ? `1px solid ${proposal.color}` : '1px solid #343536',
                  borderRadius: '8px',
                  padding: '12px',
                  color: selectedProposal === proposal.id ? proposal.color : '#9ca3af',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '12px'
                }}
                onMouseEnter={(e) => {
                  if (selectedProposal !== proposal.id) {
                    e.currentTarget.style.borderColor = proposal.color;
                    e.currentTarget.style.backgroundColor = `${proposal.color}10`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedProposal !== proposal.id) {
                    e.currentTarget.style.borderColor = '#343536';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <div style={{
                  fontWeight: 'bold',
                  marginBottom: '4px',
                  fontSize: '13px'
                }}>
                  {proposal.name}
                </div>
                <div style={{
                  fontSize: '11px',
                  lineHeight: '1.3',
                  opacity: 0.8
                }}>
                  {proposal.description}
                </div>
              </button>
              
              {selectedProposal === proposal.id && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px',
                  backgroundColor: `${proposal.color}10`,
                  borderRadius: '6px',
                  border: `1px solid ${proposal.color}30`
                }}>
                  <div style={{
                    fontSize: '11px',
                    fontWeight: 'bold',
                    color: proposal.color,
                    marginBottom: '6px'
                  }}>
                    Key Features:
                  </div>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0
                  }}>
                    {proposal.features.map((feature, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: '10px',
                          color: '#9ca3af',
                          marginBottom: '3px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <div style={{
                          width: '3px',
                          height: '3px',
                          backgroundColor: proposal.color,
                          borderRadius: '50%'
                        }} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '12px',
          padding: '8px',
          backgroundColor: '#343536',
          borderRadius: '6px',
          fontSize: '10px',
          color: '#9ca3af',
          textAlign: 'center'
        }}>
          💡 Click proposals to compare designs
        </div>
      </div>

      {/* Render Selected Proposal */}
      {renderProposal()}
    </div>
  );
};

export default HomePageShowcase;
