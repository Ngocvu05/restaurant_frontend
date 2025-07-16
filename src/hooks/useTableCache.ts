import { useEffect, useState } from 'react';
import tableApi from '../api/tableApi';

export interface Table {
  id: number;
  tableName: string;
  capacity: number;
  description?: string;
  status: 'AVAILABLE' | 'BOOKED' | 'OCCUPIED';
}

let cachedTables: Table[] | null = null;

export default function useTableCache() {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTables = async () => {
      if (cachedTables) {
        setTables(cachedTables);
        setLoading(false);
      } else {
        try {
          const response = await tableApi.getAll();
          cachedTables = response.data;
          setTables(response.data);
        } catch (error) {
          console.error('Failed to fetch tables:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTables();
  }, []);

  return { tables, loading };
}
