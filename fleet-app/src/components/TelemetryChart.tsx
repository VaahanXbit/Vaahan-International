import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import theme from '../theme';

interface TelemetryChartProps {
  data: number[]; // 7 numbers
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ data }) => {
  const chartHeight = 80;
  const chartWidth = 300;
  const padding = 15;

  // Map values to coordinates
  const points = data.map((val, idx) => {
    const x = padding + (idx * (chartWidth - padding * 2)) / (data.length - 1);
    // Map value (0-100) to Y space (clamped)
    const clampedVal = Math.min(100, Math.max(0, val));
    const y = chartHeight - padding - (clampedVal * (chartHeight - padding * 2)) / 100;
    return { x, y, value: val };
  });

  // Construct SVG Path
  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
          {/* Baseline Grid Line */}
          <Path
            d={`M ${padding} ${chartHeight - padding} L ${chartWidth - padding} ${chartHeight - padding}`}
            stroke={theme.colors.outlineVariant}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          {/* Main Telemetry Line */}
          <Path
            d={pathD}
            fill="none"
            stroke={theme.colors.primary}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Data Points */}
          {points.map((p, idx) => (
            <Circle
              key={idx}
              cx={p.x}
              cy={p.y}
              r="4"
              fill={theme.colors.surface}
              stroke={theme.colors.primary}
              strokeWidth="2"
            />
          ))}
        </Svg>
      </View>
      <View style={styles.labelRow}>
        {DAYS.map((day, idx) => (
          <View key={idx} style={styles.dayLabelContainer}>
            <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurfaceVariant, fontSize: 10 }]}>
              {day}
            </Text>
            <Text style={[theme.typography.labelCaps, { color: theme.colors.onSurface, fontSize: 9, marginTop: 2 }]}>
              {data[idx]}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceContainer,
    borderRadius: theme.rounded.md,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    padding: theme.spacing.unit * 4,
    marginVertical: theme.spacing.unit * 3,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    marginTop: theme.spacing.unit * 2,
  },
  dayLabelContainer: {
    alignItems: 'center',
  },
});
export default TelemetryChart;
