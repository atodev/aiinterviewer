import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Dimensions as RNDimensions } from 'react-native';
import { colors } from '../theme/colors';
import { Dimensions } from '../api/geminiApi';

const AXES = [
  { key: 'communication', label: 'Communication' },
  { key: 'problem_solving', label: 'Problem\nSolving' },
  { key: 'tech_depth', label: 'Tech Depth' },
  { key: 'clarity', label: 'Clarity' },
  { key: 'experience', label: 'Experience' },
] as const;

const N = AXES.length;
const SIZE = Math.min(RNDimensions.get('window').width - 48, 320);
const CX = SIZE / 2;
const CY = SIZE / 2;
const R = SIZE / 2 - 44; // radius leaving room for labels
const RINGS = [0.25, 0.5, 0.75, 1.0];

function polarPoint(index: number, fraction: number) {
  // Start from top (−π/2) and go clockwise
  const angle = (2 * Math.PI * index) / N - Math.PI / 2;
  return {
    x: CX + R * fraction * Math.cos(angle),
    y: CY + R * fraction * Math.sin(angle),
  };
}

function labelPoint(index: number) {
  const angle = (2 * Math.PI * index) / N - Math.PI / 2;
  // Push labels slightly further out than the max ring
  const dist = R + 22;
  return {
    x: CX + dist * Math.cos(angle),
    y: CY + dist * Math.sin(angle),
    angle,
  };
}

interface Props {
  dimensions: Dimensions;
}

export function RadarChart({ dimensions }: Props) {
  const values = AXES.map((a) => dimensions[a.key] / 10); // normalise to 0–1

  // Build the data polygon points string
  const dataPoints = AXES.map((_, i) => {
    const p = polarPoint(i, values[i]);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Build ring polygon points
  const ringPolygons = RINGS.map((r) => {
    const pts = AXES.map((_, i) => {
      const p = polarPoint(i, r);
      return `${p.x},${p.y}`;
    }).join(' ');
    return { r, pts };
  });

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Grid rings */}
        {ringPolygons.map(({ r, pts }) => (
          <Polygon
            key={r}
            points={pts}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}

        {/* Axis spokes */}
        {AXES.map((_, i) => {
          const tip = polarPoint(i, 1);
          return (
            <Line
              key={i}
              x1={CX}
              y1={CY}
              x2={tip.x}
              y2={tip.y}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}

        {/* Data fill */}
        <Polygon
          points={dataPoints}
          fill={`${colors.accent}33`}
          stroke={colors.accent}
          strokeWidth={2}
        />

        {/* Data dots */}
        {AXES.map((_, i) => {
          const p = polarPoint(i, values[i]);
          return (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={4}
              fill={colors.accent}
            />
          );
        })}

        {/* Axis labels */}
        {AXES.map((axis, i) => {
          const lp = labelPoint(i);
          const lines = axis.label.split('\n');
          const lineH = 13;
          const totalH = lines.length * lineH;
          return lines.map((line, li) => (
            <SvgText
              key={`${i}-${li}`}
              x={lp.x}
              y={lp.y - totalH / 2 + li * lineH + lineH / 2}
              textAnchor="middle"
              fill={colors.textMuted}
              fontSize={11}
              fontWeight="600"
            >
              {line}
            </SvgText>
          ));
        })}

        {/* Score labels inside each spoke */}
        {AXES.map((a, i) => {
          const score = dimensions[a.key];
          const p = polarPoint(i, values[i]);
          return (
            <SvgText
              key={`score-${i}`}
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              fill={colors.accent}
              fontSize={10}
              fontWeight="700"
            >
              {score}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});
