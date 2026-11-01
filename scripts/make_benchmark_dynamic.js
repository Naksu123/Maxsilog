const fs = require('fs');

let b = fs.readFileSync('frontend/src/app/benchmark/page.tsx', 'utf8');

// Add ChartDefs import
if (!b.includes('import ChartDefs')) {
  b = b.replace(
    'import AppleChartCard from "@/components/charts/AppleChartCard";',
    'import AppleChartCard from "@/components/charts/AppleChartCard";\nimport ChartDefs from "@/components/charts/ChartDefs";'
  );
}

// Add hover tracking states
if (!b.includes('const [hoveredMaeIdx, setHoveredMaeIdx]')) {
  b = b.replace(
    'const [baselineModelName, setBaselineModelName] = useState<string>("Simple Linear Regression (Baseline)");',
    `const [baselineModelName, setBaselineModelName] = useState<string>("Simple Linear Regression (Baseline)");
  const [hoveredMaeIdx, setHoveredMaeIdx] = useState<number | null>(null);
  const [hoveredR2Idx, setHoveredR2Idx] = useState<number | null>(null);`
  );
}

// Update MAE BarChart
const oldMaeChart = `<BarChart
                data={processedMetrics}
                margin={{ top: 20, right: 20, bottom: 25, left: 15 }}
              >`;

const newMaeChart = `<BarChart
                data={processedMetrics}
                margin={{ top: 20, right: 20, bottom: 25, left: 15 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredMaeIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredMaeIdx(null)}
              >
                <ChartDefs />`;

const oldMaeBar = `<Bar dataKey="mae" radius={[8, 8, 0, 0]}>
                  {processedMetrics.map((entry) => (
                    <Cell key={\`cell-\${entry.model}\`} fill={entry.color} />
                  ))}
                </Bar>`;

const newMaeBar = `<Bar 
                  dataKey="mae" 
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedMetrics.map((entry, index) => {
                    const isHovered = hoveredMaeIdx === index;
                    const isAnyHovered = hoveredMaeIdx !== null;
                    const fill = entry.model.includes("Gradient")
                      ? (isHovered ? "url(#purpleBarGradActive)" : "url(#purpleBarGrad)")
                      : entry.model.includes("Random")
                      ? (isHovered ? "url(#blueBarGradActive)" : "url(#blueBarGrad)")
                      : entry.model.includes("Ridge")
                      ? (isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)")
                      : (isHovered ? "url(#amberBarGradActive)" : "url(#amberBarGrad)");
                    return (
                      <Cell
                        key={\`cell-\${entry.model}\`}
                        fill={fill}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.85)" : "transparent"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>`;

b = b.replace(oldMaeChart, newMaeChart);
b = b.replace(oldMaeBar, newMaeBar);

// Update R2 BarChart
const oldR2Chart = `<BarChart
                data={processedMetrics}
                margin={{ top: 20, right: 20, bottom: 25, left: 10 }}
              >`;

const newR2Chart = `<BarChart
                data={processedMetrics}
                margin={{ top: 20, right: 20, bottom: 25, left: 10 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredR2Idx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredR2Idx(null)}
              >
                <ChartDefs />`;

const oldR2Bar = `<Bar dataKey="r2Pct" radius={[8, 8, 0, 0]}>
                  {processedMetrics.map((entry) => (
                    <Cell
                      key={\`cell-r2-\${entry.model}\`}
                      fill={entry.r2Pct >= 0 ? entry.color : CHART_COLORS.red}
                    />
                  ))}
                </Bar>`;

const newR2Bar = `<Bar 
                  dataKey="r2Pct" 
                  radius={[8, 8, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedMetrics.map((entry, index) => {
                    const isHovered = hoveredR2Idx === index;
                    const isAnyHovered = hoveredR2Idx !== null;
                    const fill = entry.r2Pct < 0
                      ? "url(#redBarGrad)"
                      : entry.model.includes("Gradient")
                      ? (isHovered ? "url(#purpleBarGradActive)" : "url(#purpleBarGrad)")
                      : entry.model.includes("Random")
                      ? (isHovered ? "url(#blueBarGradActive)" : "url(#blueBarGrad)")
                      : entry.model.includes("Ridge")
                      ? (isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)")
                      : (isHovered ? "url(#amberBarGradActive)" : "url(#amberBarGrad)");
                    return (
                      <Cell
                        key={\`cell-r2-\${entry.model}\`}
                        fill={fill}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.85)" : "transparent"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>`;

b = b.replace(oldR2Chart, newR2Chart);
b = b.replace(oldR2Bar, newR2Bar);

fs.writeFileSync('frontend/src/app/benchmark/page.tsx', b, 'utf8');
console.log('Successfully updated benchmark page charts with dynamic gradients and hover states');

