import { SearchResult } from '../api/profileSearch';

/**
 * Mock data for development and testing
 * Matches the SearchResult interface exactly
 */
export const generateMockSearchResults = (
  titles: string[] = ['Software Engineer'],
  companies: string[] = ['TechCorp'],
  count: number = 10
): SearchResult[] => {
  const firstNames = [
    'Sarah', 'Michael', 'Emily', 'David', 'Jessica', 'Alex', 'Maria', 'Chris',
    'Ashley', 'James', 'Jennifer', 'Robert', 'Lisa', 'John', 'Amanda', 'Daniel'
  ];
  
  const lastNames = [
    'Johnson', 'Chen', 'Rodriguez', 'Kim', 'Taylor', 'Wilson', 'Garcia', 'Brown',
    'Davis', 'Miller', 'Anderson', 'Moore', 'Jackson', 'White', 'Thompson', 'Martinez'
  ];
  
  const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com'];
  
  const results: SearchResult[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const title = titles[i % titles.length];
    const company = companies[i % companies.length];
    const domain = emailDomains[i % emailDomains.length];
    
    // Generate phone number
    const areaCode = 200 + (i % 800); // Area codes from 200-999
    const phone = `+1${areaCode}555${String(i).padStart(4, '0')}`;
    
    // Generate confidence score between 70-99
    const confidence = Math.floor(Math.random() * 30) + 70;
    
    results.push({
      id: `mock-${Date.now()}-${i}`,
      name: `${firstName} ${lastName}`,
      jobTitle: title,
      company: company,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
      phone: phone,
      linkedInUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
      confidence: confidence,
      snippet: `${firstName} ${lastName} is an experienced ${title} at ${company} with proven expertise in their field. Known for delivering high-quality results and collaborating effectively with cross-functional teams.`
    });
  }
  
  return results;
};

/**
 * Static mock data for consistent testing
 */
export const mockSearchResults: SearchResult[] = [
  {
    id: 'mock-static-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    jobTitle: 'Senior Software Engineer',
    company: 'TechCorp',
    phone: '+1415555001',
    linkedInUrl: 'https://linkedin.com/in/sarah-johnson',
    confidence: 95,
    snippet: 'Sarah is a seasoned Senior Software Engineer at TechCorp with over 8 years of experience in full-stack development.'
  },
  {
    id: 'mock-static-2',
    name: 'Michael Chen',
    email: 'michael.chen@startupco.com',
    jobTitle: 'Product Manager',
    company: 'StartupCo',
    phone: '+1512555002',
    linkedInUrl: 'https://linkedin.com/in/michael-chen',
    confidence: 88,
    snippet: 'Michael is a strategic Product Manager at StartupCo with expertise in product development and user experience.'
  },
  {
    id: 'mock-static-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@megacorp.com',
    jobTitle: 'VP of Engineering',
    company: 'MegaCorp',
    phone: '+1212555003',
    linkedInUrl: 'https://linkedin.com/in/emily-rodriguez',
    confidence: 92,
    snippet: 'Emily leads engineering teams at MegaCorp with over 12 years of leadership experience in scaling technology organizations.'
  },
  {
    id: 'mock-static-4',
    name: 'David Kim',
    email: 'david.kim@innovate.io',
    jobTitle: 'Data Scientist',
    company: 'Innovate.io',
    phone: '+1206555004',
    linkedInUrl: 'https://linkedin.com/in/david-kim',
    confidence: 85,
    snippet: 'David specializes in machine learning and data analytics at Innovate.io, driving data-driven decision making.'
  },
  {
    id: 'mock-static-5',
    name: 'Jessica Taylor',
    email: 'jessica.taylor@cloudtech.com',
    jobTitle: 'DevOps Engineer',
    company: 'CloudTech',
    phone: '+1303555005',
    linkedInUrl: 'https://linkedin.com/in/jessica-taylor',
    confidence: 90,
    snippet: 'Jessica builds and maintains cloud infrastructure at CloudTech, specializing in automation and scalability.'
  }
];
