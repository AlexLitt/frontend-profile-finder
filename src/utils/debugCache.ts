// Debugging utility for localStorage cache inspection
// Add this to your browser console to inspect cache contents

export function debugLocalStorageCache() {
  console.log('=== localStorage Cache Debug ===');
  
  const cacheKeys = [];
  const otherKeys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (key.startsWith('df_')) {
        cacheKeys.push(key);
      } else {
        otherKeys.push(key);
      }
    }
  }
  
  console.log('Cache keys found:', cacheKeys.length);
  console.log('Other keys found:', otherKeys.length);
  
  cacheKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        const parsed = JSON.parse(value);
        
        if (key.startsWith('df_results_cache_')) {
          console.log(`\n📦 ${key}:`);
          if (parsed.__timestamp) {
            console.log('  Timestamp:', new Date(parsed.__timestamp).toLocaleString());
            console.log('  Age:', Math.round((Date.now() - parsed.__timestamp) / 1000 / 60), 'minutes');
            console.log('  Query params:', parsed.__queryParams);
            console.log('  Results count:', Array.isArray(parsed.results) ? parsed.results.length : 'N/A');
            if (Array.isArray(parsed.results) && parsed.results.length > 0) {
              console.log('  Sample result:', parsed.results[0]);
            }
          } else {
            console.log('  Legacy format, results count:', Array.isArray(parsed) ? parsed.length : 'N/A');
          }
        } else if (key === 'df_accumulated_results') {
          console.log(`\n🗂️ ${key}:`);
          if (parsed.__timestamp) {
            console.log('  Timestamp:', new Date(parsed.__timestamp).toLocaleString());
            console.log('  Age:', Math.round((Date.now() - parsed.__timestamp) / 1000 / 60), 'minutes');
            console.log('  Total accumulated results:', Array.isArray(parsed.results) ? parsed.results.length : 'N/A');
            if (Array.isArray(parsed.results) && parsed.results.length > 0) {
              // Show unique search sources
              const sources = parsed.results.map(r => r.__searchSource).filter(Boolean);
              const uniqueSources = sources.reduce((acc, source) => {
                const key = `${source.jobTitles.join(',')}@${source.companies.join(',')}`;
                acc[key] = (acc[key] || 0) + 1;
                return acc;
              }, {} as Record<string, number>);
              console.log('  Search sources:', uniqueSources);
            }
          } else {
            console.log('  Legacy format, results count:', Array.isArray(parsed) ? parsed.length : 'N/A');
          }
        } else {
          console.log(`\n📄 ${key}:`, Array.isArray(parsed) ? `Array(${parsed.length})` : typeof parsed);
        }
      }
    } catch (e) {
      console.warn(`⚠️ Error parsing ${key}:`, e);
    }
  });
  
  console.log('\n=== End Debug ===');
}

// Make it available globally for console use
if (typeof window !== 'undefined') {
  (window as any).debugLocalStorageCache = debugLocalStorageCache;
}
