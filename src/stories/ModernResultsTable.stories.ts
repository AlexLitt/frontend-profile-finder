import type { Meta, StoryObj } from '@storybook/react';
import ModernResultsTable from '../components/ModernResultsTable';

const meta: Meta<typeof ModernResultsTable> = {
  title: 'Components/ModernResultsTable',
  component: ModernResultsTable,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof ModernResultsTable>;

// Mock data
const mockResults = Array(10).fill(0).map((_, i) => ({
  id: `mock-${i}`,
  name: `John Doe ${i+1}`,
  jobTitle: 'Software Engineer',
  company: 'Tech Company',
  linkedInUrl: 'https://linkedin.com/in/john-doe',
  email: `john.doe${i+1}@example.com`,
  phone: `+1-555-${1000+i}`,
  confidence: 90 - (i * 5)
}));

export const Default: Story = {
  args: {
    results: mockResults,
    selectedKeys: new Set(['mock-0', 'mock-1']),
    onSelectionChange: () => {},
    currentPage: 1,
    onPageChange: () => {},
    totalPages: 5,
    onExport: () => {},
    onCrmIntegration: () => {},
    onSaveToList: () => {}
    // COPILOT REMOVE SEARCH-SOURCE-TAG: Removed showSearchSource prop
  },
};

// COPILOT REMOVE SEARCH-SOURCE-TAG: Removed WithSearchSource story
export const WithMetadata: Story = {
  args: {
    ...Default.args,
    results: mockResults.map(result => ({
      ...result,
      __searchSource: {
        jobTitles: ['Software Engineer'],
        companies: ['Tech Company'],
        timestamp: Date.now()
      }
    }))
  },
};

// COPILOT FIX: Test that checkbox positioning is correct and stays within column
export const WithCheckboxAlignment: Story = {
  args: {
    ...Default.args,
    selectedKeys: new Set(mockResults.map(r => r.id)) // Select all rows
  },
  parameters: {
    docs: {
      description: {
        story: 'This story validates that checkboxes stay properly contained in their own column without overlapping name data'
      }
    }
  }
};

// Long names test to verify there's no overlap
export const WithLongNames: Story = {
  args: {
    ...Default.args,
    results: mockResults.map(result => ({
      ...result,
      name: `${result.name} with a very long name that could potentially cause overlap issues with the checkbox`
    })),
    selectedKeys: new Set(mockResults.map(r => r.id)) // Select all rows
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests the table with very long names to ensure there is no overlap between checkbox and name'
      }
    }
  }
};
