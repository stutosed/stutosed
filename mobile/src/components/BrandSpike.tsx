import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface BrandSpikeProps {
  size?: number;
  color?: string;
}

export const BrandSpike: React.FC<BrandSpikeProps> = ({ size = 18, color }) => {
  const { colors } = useTheme();
  const strokeColor = color || colors.accent;

  return (
    <Svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke={strokeColor}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="12" r="3.5" fill={strokeColor} />
      <Circle cx="12" cy="12" r="6.5" stroke={strokeColor} strokeWidth={1.2} />
      <Circle cx="12" cy="12" r="9" stroke={strokeColor} strokeWidth={0.8} />
      <Path d="M12 3.5V1M12 20.5v2.5M3.5 12H1M20.5 12h2.5M6 6L4 4M18 18l2 2M6 18l-2 2M18 6l2-2" />
    </Svg>
  );
};
