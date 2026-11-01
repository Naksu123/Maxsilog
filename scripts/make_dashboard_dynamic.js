const fs = require('fs');

let d = fs.readFileSync('frontend/src/app/dashboard/page.tsx', 'utf8');

// Add ChartDefs import
if (!d.includes('import ChartDefs')) {
  d = d.replace(
    'import AppleChartCard from "@/components/charts/AppleChartCard";',
    'import AppleChartCard from "@/components/charts/AppleChartCard";\nimport ChartDefs from "@/components/charts/ChartDefs";'
  );
}

// Add hover tracking state
if (!d.includes('const [hoveredPriceIdx, setHoveredPriceIdx]')) {
  d = d.replace(
    'const [error, setError] = useState<string | null>(null);',
    'const [error, setError] = useState<string | null>(null);\n  const [hoveredPriceIdx, setHoveredPriceIdx] = useState<number | null>(null);'
  );
}

// Update BarChart in Dashboard
const oldDashChart = `<BarChart data={processedPriceDist} margin={{ top: 10, right: 10, bottom: 30, left: 0 }}>`;
const newDashChart = `<BarChart 
                data={processedPriceDist} 
                margin={{ top: 10, right: 10, bottom: 30, left: 0 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredPriceIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredPriceIdx(null)}
              >
                <ChartDefs />`;

const oldDashBar = `<Bar dataKey="count" fill={CHART_COLORS.teal} radius={[6, 6, 0, 0]} />`;
const newDashBar = `<Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedPriceDist.map((_, index) => {
                    const isHovered = hoveredPriceIdx === index;
                    const isAnyHovered = hoveredPriceIdx !== null;
                    return (
                      <Cell
                        key={\`cell-dash-price-\${index}\`}
                        fill={isHovered ? "url(#purpleBarGradActive)" : "url(#purpleBarGrad)"}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(192, 132, 252, 0.25)"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>`;

d = d.replace(oldDashChart, newDashChart);
d = d.replace(oldDashBar, newDashBar);

fs.writeFileSync('frontend/src/app/dashboard/page.tsx', d, 'utf8');
console.log('Successfully updated dashboard page chart with dynamic gradient and hover state');

