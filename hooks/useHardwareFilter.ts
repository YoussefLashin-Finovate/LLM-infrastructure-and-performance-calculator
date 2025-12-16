import { useMemo } from 'react';
import { hardwareDatabase, HardwareOption } from '@/lib/hardwareDatabase';
import { getHardwareFamily, HARDWARE_FAMILIES } from '@/lib/config';

export function useHardwareFilter(quantization: string) {
  return useMemo(() => {
    // Filter hardware to match selected quantization
    const available = hardwareDatabase.filter(hw => 
      hw.quantTypes.includes(quantization as any)
    );
    
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
  return useMemo(() => {
    // Filter hardware to match selected quantization
    const filteredHardware = hardwareDatabase.filter(hw => 
      hw.quantTypes.includes(quantization as any)
    );
    
    // Group by hardware family
    const groups: { [key: string]: HardwareOption[] } = {};
    filteredHardware.forEach(hw => {
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
    
    // Fallback to all hardware if no match (shouldn't happen)
    return result.length > 0 ? result : [{ family: 'All Hardware', options: hardwareDatabase }];
  }, [quantization]);
}
