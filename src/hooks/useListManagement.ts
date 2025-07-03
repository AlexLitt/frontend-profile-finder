import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SearchResult } from '../api/profileSearch';

export interface ProspectList {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  prospects: SearchResult[];
  color?: string; // For visual organization
}

const STORAGE_KEY = 'df_prospect_lists';

// Storage utilities
const getStoredLists = (): ProspectList[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.warn('Error reading prospect lists:', e);
    return [];
  }
};

const setStoredLists = (lists: ProspectList[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
  } catch (e) {
    console.warn('Error saving prospect lists:', e);
  }
};

// Generate unique ID
const generateId = () => `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export function useListManagement() {
  const queryClient = useQueryClient();

  // Get all lists
  const useLists = () => {
    return useQuery<ProspectList[]>({
      queryKey: ['prospectLists'],
      queryFn: () => getStoredLists(),
      staleTime: 1000 * 60 * 5, // 5 minutes
    });
  };

  // Create a new list
  const useCreateList = () => {
    return useMutation({
      mutationFn: async ({ 
        name, 
        description, 
        prospects = [],
        color 
      }: { 
        name: string; 
        description?: string; 
        prospects?: SearchResult[];
        color?: string;
      }) => {
        const lists = getStoredLists();
        const newList: ProspectList = {
          id: generateId(),
          name,
          description,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          prospects,
          color
        };
        
        const updatedLists = [newList, ...lists];
        setStoredLists(updatedLists);
        return newList;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['prospectLists'] });
      },
    });
  };

  // Update an existing list
  const useUpdateList = () => {
    return useMutation({
      mutationFn: async ({ 
        id, 
        name, 
        description,
        color 
      }: { 
        id: string; 
        name?: string; 
        description?: string;
        color?: string;
      }) => {
        const lists = getStoredLists();
        const updatedLists = lists.map(list => {
          if (list.id === id) {
            return {
              ...list,
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description }),
              ...(color !== undefined && { color }),
              updatedAt: Date.now()
            };
          }
          return list;
        });
        
        setStoredLists(updatedLists);
        return updatedLists.find(list => list.id === id);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['prospectLists'] });
      },
    });
  };

  // Delete a list
  const useDeleteList = () => {
    return useMutation({
      mutationFn: async (listId: string) => {
        const lists = getStoredLists();
        const updatedLists = lists.filter(list => list.id !== listId);
        setStoredLists(updatedLists);
        return listId;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['prospectLists'] });
      },
    });
  };

  // Add prospects to a list
  const useAddToList = () => {
    return useMutation({
      mutationFn: async ({ 
        listId, 
        prospects 
      }: { 
        listId: string; 
        prospects: SearchResult[] 
      }) => {
        const lists = getStoredLists();
        const updatedLists = lists.map(list => {
          if (list.id === listId) {
            // Deduplicate by ID or name+email
            const existingIds = new Set(
              list.prospects.map(p => p.id || `${p.name}_${p.email}`)
            );
            
            const newProspects = prospects.filter(prospect => {
              const prospectId = prospect.id || `${prospect.name}_${prospect.email}`;
              return !existingIds.has(prospectId);
            });
            
            return {
              ...list,
              prospects: [...list.prospects, ...newProspects],
              updatedAt: Date.now()
            };
          }
          return list;
        });
        
        setStoredLists(updatedLists);
        return updatedLists.find(list => list.id === listId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['prospectLists'] });
      },
    });
  };

  // Remove prospects from a list
  const useRemoveFromList = () => {
    return useMutation({
      mutationFn: async ({ 
        listId, 
        prospectIds 
      }: { 
        listId: string; 
        prospectIds: string[] 
      }) => {
        const lists = getStoredLists();
        const updatedLists = lists.map(list => {
          if (list.id === listId) {
            return {
              ...list,
              prospects: list.prospects.filter(prospect => {
                const prospectId = prospect.id || `${prospect.name}_${prospect.email}`;
                return !prospectIds.includes(prospectId);
              }),
              updatedAt: Date.now()
            };
          }
          return list;
        });
        
        setStoredLists(updatedLists);
        return updatedLists.find(list => list.id === listId);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['prospectLists'] });
      },
    });
  };

  // Get lists that contain a specific prospect
  const getListsContainingProspect = (prospectId: string): ProspectList[] => {
    const lists = getStoredLists();
    return lists.filter(list => 
      list.prospects.some(prospect => {
        const id = prospect.id || `${prospect.name}_${prospect.email}`;
        return id === prospectId;
      })
    );
  };

  return {
    useLists,
    useCreateList,
    useUpdateList,
    useDeleteList,
    useAddToList,
    useRemoveFromList,
    getListsContainingProspect
  };
}
