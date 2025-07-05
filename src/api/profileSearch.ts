// Helper to parse comma or space separated lists
export function parseList(input: string): string[] {
  return input
    .split(/,|\s+/)
    .map(s => s.trim())
    .filter(Boolean);
}

export interface SearchResult {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  email: string;
  phone: string;
  linkedInUrl: string;
  confidence: number;
  snippet: string;
  __searchSource?: {
    jobTitles: string[];
    companies: string[];
    timestamp: number;
  };
}

// Mock data generator helper
function generateMockProfiles(titles: string[], companies: string[]): SearchResult[] {
  const firstNames = ["John", "Sarah", "Michael", "Emma", "David", "Lisa", "James", "Emily"];
  const lastNames = ["Smith", "Johnson", "Brown", "Davis", "Wilson", "Moore", "Taylor", "Anderson"];
  const domains = ["gmail.com", "yahoo.com", "outlook.com", "company.com"];
  
  const results: SearchResult[] = [];
  
  titles.forEach(title => {
    companies.forEach(company => {
      // Generate 2-3 profiles per title+company combination
      const numProfiles = Math.floor(Math.random() * 2) + 2;
      
      for (let i = 0; i < numProfiles; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const confidence = Math.floor(Math.random() * 15) + 85; // 85-99
        
        results.push({
          id: `${Date.now()}-${Math.random()}`,
          name: `${firstName} ${lastName}`,
          jobTitle: title,
          company: company,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`,
          phone: `+1${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 900 + 100)}${Math.floor(Math.random() * 10000)}`,
          linkedInUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.floor(Math.random() * 1000)}`,
          confidence,
          snippet: `${firstName} is a seasoned ${title} at ${company} with over ${Math.floor(Math.random() * 15) + 5} years of experience. Known for ${confidence > 95 ? 'exceptional' : 'strong'} leadership and innovative solutions in ${company}'s tech initiatives.`
        });
      }
    });
  });
  
  return results;
}

export async function fetchProfiles({ titles, companies }: { titles: string; companies: string }): Promise<SearchResult[]> {
  const webhookBase = import.meta.env.VITE_N8N_WEBHOOK_BASE;
  const webhookPath = import.meta.env.VITE_N8N_WEBHOOK_PATH;

  try {
    const searchParams = new URLSearchParams({
      titles: titles || "",
      companies: companies || ""
    }).toString();

    // Use the full webhook URL with query parameters
    const url = `${webhookBase}/webhook/${webhookPath}${searchParams ? '?' + searchParams : ''}`;
    
    
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json"
    };
    
    const response = await fetch(url, {
      method: "GET",
      headers,
      mode: 'cors'
    });

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      const text = await response.text();
      console.error("Response body:", text);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.text();
    
    let data;
    try {
      data = JSON.parse(rawData);
      
      // Handle non-array responses
      if (!Array.isArray(data)) {
        if (typeof data === 'object' && data !== null) {
          data = [data]; // Convert single object to array
        } else {
          return [];
        }
      }
      
      // Transform the webhook response to match our SearchResult interface
      const transformedProfiles = data.map((item: any, index: number) => {
        
        if (!item || typeof item !== 'object') {
          return null;
        }

        // First try to extract from combined name field if present
        let extractedName = "";
        let extractedTitle = "";
        let extractedCompany = "";
        
        if (item.name && item.name.includes(" - ")) {
          const parts = item.name.split(" - ").map(p => p.trim());
          extractedName = parts[0];
          extractedTitle = parts[1] || "";
          extractedCompany = parts[2] || "";
        }

        const result = {
          id: item.id || `${Date.now()}-${Math.random()}`,
          name: extractedName || item.name || "Unknown",
          jobTitle: extractedTitle || item.jobTitle || item.JobTitle || "",
          company: extractedCompany || item.company || "",
          email: item.email || "",
          phone: item.phone || "",
          linkedInUrl: item.linkedInUrl || item.linkedinUrl || "",
          confidence: typeof item.confidence === 'number' ? item.confidence : 85,
          snippet: item.snippet || ""
        };

        // Generate snippet if missing
        if (!result.snippet && result.name && result.jobTitle && result.company) {
          result.snippet = `${result.name} is a ${result.jobTitle} at ${result.company}`;
        }

        // Clean up any [null] values
        Object.keys(result).forEach(key => {
          const value = result[key as keyof typeof result];
          if (value === "[null]" || value === null) {
            result[key as keyof typeof result] = "";
          }
        });

        return result;
      }).filter((profile): profile is SearchResult => {
        if (!profile) {
          return false;
        }
        const isValid = profile.name !== "[null]" && 
                       (profile.name || profile.jobTitle || profile.company);
        if (!isValid) {
          return false;
        }
        return isValid;
      });
      
      return transformedProfiles;
      
    } catch (e) {
      console.error("Failed to process profiles:", e);
      return [];
    }
  } catch (error) {
    console.error("Error fetching profiles:", error);
    throw error;
  }
}