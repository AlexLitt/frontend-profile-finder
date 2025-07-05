import { SearchResult } from '../api/profileSearch';

export const mockSearchResults: SearchResult[] = [
  {
    id: 'mock-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@techcorp.com',
    jobTitle: 'Senior Software Engineer',
    company: 'TechCorp',
    phone: '+1415555010',
    linkedInUrl: 'https://linkedin.com/in/sarah-johnson',
    confidence: 0.95,
    snippet: 'Sarah is a seasoned Senior Software Engineer at TechCorp with over 8 years of experience.'
  },
  {
    id: 'mock-2',
    name: 'Michael Chen',
    email: 'michael.chen@startupco.com',
    jobTitle: 'Product Manager',
    company: 'StartupCo',
    phone: '+1512555020',
    linkedInUrl: 'https://linkedin.com/in/michael-chen',
    confidence: 0.88,
    snippet: 'Michael is a strategic Product Manager at StartupCo with expertise in product development.'
  },
  {
    id: 'mock-3',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@megacorp.com',
    jobTitle: 'VP of Engineering',
    company: 'MegaCorp',
    phone: '+1212555030',
    linkedInUrl: 'https://linkedin.com/in/emily-rodriguez',
    confidence: 0.92,
    snippet: 'Emily leads engineering teams at MegaCorp with over 12 years of leadership experience.'
  },
  {
    id: 'mock-4',
    name: 'David Kim',
    email: 'david.kim@innovate.io',
    jobTitle: 'Data Scientist',
    company: 'Innovate.io',
    phone: '+1206555040',
    linkedInUrl: 'https://linkedin.com/in/david-kim',
    confidence: 0.85,
    snippet: 'David specializes in machine learning and data analytics at Innovate.io.'
  },
  {
    id: 'mock-5',
    name: 'Jessica Taylor',
    email: 'jessica.taylor@cloudtech.com',
    jobTitle: 'DevOps Engineer',
    company: 'CloudTech',
    phone: '+1303555050',
    linkedInUrl: 'https://linkedin.com/in/jessica-taylor',
    confidence: 0.90,
    snippet: 'Jessica builds and maintains cloud infrastructure at CloudTech.'
  }
];

export const createMockSearchResults = (count: number = 5): SearchResult[] => {
  const names = ['John Doe', 'Jane Smith', 'Alex Wilson', 'Maria Garcia', 'Chris Brown', 'Lisa Wang', 'Tom Anderson', 'Amy Davis'];
  const companies = ['TechStart', 'InnovaCorp', 'FutureTech', 'CloudSoft', 'DataFlow', 'AI Systems', 'WebCorp', 'CodeLab'];
  const titles = ['Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Engineering Manager'];

  return Array.from({ length: count }, (_, i) => ({
    id: `mock-${i + 1}`,
    name: names[i % names.length],
    email: `${names[i % names.length].toLowerCase().replace(' ', '.')}@${companies[i % companies.length].toLowerCase()}.com`,
    jobTitle: titles[i % titles.length],
    company: companies[i % companies.length],
    phone: `+1${(415 + i).toString().padStart(3, '0')}555${(100 + i).toString().padStart(3, '0')}`,
    linkedInUrl: `https://linkedin.com/in/${names[i % names.length].toLowerCase().replace(' ', '-')}`,
    confidence: Math.random() * 0.3 + 0.7, // 0.7 to 1.0
    snippet: `${names[i % names.length]} is an experienced ${titles[i % titles.length]} at ${companies[i % companies.length]} with strong technical skills.`
  }));
};
