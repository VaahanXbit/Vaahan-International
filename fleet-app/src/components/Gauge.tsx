import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import theme from '../theme';

interface GaugeProps {
  value: number; // 0 to 100 for gauge rendering
  displayValue: string; // The text to show in the center (e.g. "94", "12%", "-1.2%")
  labelText: string;
  size?: 'sm' | 'lg';
  thresholds?: {
    red: number;
    amber: number;
  };
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  displayValue,
  labelText,
  size = 'sm',
  thresholds = { red: 50, amber: 75 },
}) => {
  // Clamp value between 0 and 100 for display arc
  const clampedVal = Math.min(100, Math.max(0, value));

  // Determine color based on thresholds
  let strokeColor: string = theme.colors.primary; // Green/Primary by default
  if (value < thresholds.red) {
    strokeColor = theme.colors.error; // Red
  } else if (value <= thresholds.amber) {
    strokeColor = '#d97706'; // Amber / Orange
  }

  // Dimensions & parameters
  const isLg = size === 'lg';
  const radius = isLg ? 85 : 40;
  const strokeWidth = isLg ? 10 : 6;
  const arcLength = Math.PI * radius;
  const dashOffset = arcLength * (1 - clampedVal / 100);

  const viewBox = isLg ? '0 0 200 110' : '0 0 100 60';
  const pathD = isLg 
    ? 'M 15 100 A 85 85 0 0 1 185 100'
    : 'M 10 50 A 40 40 0 0 1 90 50';

  return (
    <View style={isLg ? styles.lgContainer : styles.smContainer}>
      <View style={isLg ? styles.lgSvgWrapper : styles.smSvgWrapper}>
        <Svg width="100%" height="100%" viewBox={viewBox}>
          {/* Background Track */}
          <Path
            d={pathD}
            fill="none"
            stroke={theme.colors.surfaceContainerHighest}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active Progress */}
          <Path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${arcLength}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </Svg>

        {/* Centered text display */}
        <View style={isLg ? styles.lgTextOverlay : styles.smTextOverlay}>
          <Text style={[
            isLg ? theme.typography.metricLg : theme.typography.headlineMd,
            { color: theme.colors.onSurface, fontWeight: '700' }
          ]}>
            {displayValue}
          </Text>
          <Text style={[
            theme.typography.labelCaps,
            { color: theme.colors.onSurfaceVariant, textTransform: 'uppercase', marginTop: 2 }
          ]}>
            {labelText}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  lgContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.unit * 4,
  },
  smContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.unit * 2,
  },
  lgSvgWrapper: {
    width: 220,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smSvgWrapper: {
    width: 120,
    height: 70,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lgTextOverlay: {
    position: 'absolute',
    bottom: 5,
    alignItems: 'center',
  },
  smTextOverlay: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
  },
});
export default Gauge;
