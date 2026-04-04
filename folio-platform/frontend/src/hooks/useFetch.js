import { useCallback } from 'react';
import API from '../utils/api';

export const useFetch = () => {
  const request = useCallback(async (method, url, data = null, options = {}) => {
    try {
      const config = {
        method,
        url,
        ...options,
      };

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        config.data = data;
      }

      const response = await API(config);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data || error.message };
    }
  }, []);

  return request;
};
