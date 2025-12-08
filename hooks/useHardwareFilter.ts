import { useMemo } from 'react';
import { hardwareDatabase, HardwareOption } from '@/lib/hardwareDatabase';
import { getHardwareFamily, HARDWARE_FAMILIES } from '@/lib/config';

export function useHardwareFilter(quantization: string) {
  return useMemo(() => {
    // Show ALL hardware regardless of quantization - let users choose
    const available = hardwareDatabase;
    
    // Group by hardware family
    const groups: { [key: string]: HardwareOption[] } = {};
    available.forEach(hw => {
      const family = getHardwareFamily(hw.name);
      if (!groups[family]) groups[family] = [];
      groups[family].push(hw);
    });
    
    return { available, groups };
  }, [quantization]);
}

export function useHardwareGroups(quantization: string) {
  // ALWAYS return all hardware - ignore quantization filtering completely
  return useMemo(() => {
    // Group by hardware family
    const groups: { [key: string]: HardwareOption[] } = {};
    hardwareDatabase.forEach(hw => {
      const family = getHardwareFamily(hw.name);
      if (!groups[family]) groups[family] = [];
      groups[family].push(hw);
    });
    
    // Convert to array format, keeping only families that exist
    const result = HARDWARE_FAMILIES.map(family => {
      if (groups[family] && groups[family].length > 0) {
        return { family, options: groups[family] };
      }
      return null;
    }).filter((item): item is { family: string; options: HardwareOption[] } => item !== null);
    
    // ALWAYS return at least something - this ensures hardware is never empty
    return result.length > 0 ? result : [{ family: 'All Hardware', options: hardwareDatabase }];
  }, []); // No dependencies - always returns the same result
}
