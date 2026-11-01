const fs = require('fs');

// ========================================================
// 1. UPDATE ANALYTICS PAGE (frontend/src/app/analytics/page.tsx)
// ========================================================
let a = fs.readFileSync('frontend/src/app/analytics/page.tsx', 'utf8');

// Add ChartDefs import
if (!a.includes('import ChartDefs')) {
  a = a.replace(
    'import AppleChartCard from "@/components/charts/AppleChartCard";',
    'import AppleChartCard from "@/components/charts/AppleChartCard";\nimport ChartDefs from "@/components/charts/ChartDefs";'
  );
}

// Add hover tracking states
if (!a.includes('const [hoveredPriceIdx, setHoveredPriceIdx]')) {
  a = a.replace(
    'const [tableSearch, setTableSearch] = useState<string>("");',
    `const [tableSearch, setTableSearch] = useState<string>("");
  const [hoveredPriceIdx, setHoveredPriceIdx] = useState<number | null>(null);
  const [hoveredMileageIdx, setHoveredMileageIdx] = useState<number | null>(null);
  const [hoveredTopCarIdx, setHoveredTopCarIdx] = useState<number | null>(null);
  const [hoveredRegionIdx, setHoveredRegionIdx] = useState<number | null>(null);`
  );
}

// Update Price Distribution BarChart
const oldPriceChart = `<BarChart data={processedPriceDist} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>`;
const newPriceChart = `<BarChart 
                data={processedPriceDist} 
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredPriceIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredPriceIdx(null)}
              >
                <ChartDefs />`;

const oldPriceBar = `<Bar 
                  dataKey={priceDistMode === "share" ? "share" : "count"} 
                  fill={CHART_COLORS.blue} 
                  radius={[6, 6, 0, 0]} 
                />`;

const newPriceBar = `<Bar 
                  dataKey={priceDistMode === "share" ? "share" : "count"} 
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
                        key={\`cell-price-\${index}\`}
                        fill={isHovered ? "url(#purpleBarGradActive)" : "url(#purpleBarGrad)"}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(192, 132, 252, 0.25)"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>`;

a = a.replace(oldPriceChart, newPriceChart);
a = a.replace(oldPriceBar, newPriceBar);

// Update Mileage Distribution BarChart
const oldMileageChart = `<BarChart data={processedMileageDist} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>`;
const newMileageChart = `<BarChart 
                data={processedMileageDist} 
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredMileageIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredMileageIdx(null)}
              >
                <ChartDefs />`;

const oldMileageBar = `<Bar 
                  dataKey={mileageDistMode === "share" ? "share" : "count"} 
                  fill={CHART_COLORS.teal} 
                  radius={[6, 6, 0, 0]} 
                />`;

const newMileageBar = `<Bar 
                  dataKey={mileageDistMode === "share" ? "share" : "count"} 
                  radius={[8, 8, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {processedMileageDist.map((_, index) => {
                    const isHovered = hoveredMileageIdx === index;
                    const isAnyHovered = hoveredMileageIdx !== null;
                    return (
                      <Cell
                        key={\`cell-mileage-\${index}\`}
                        fill={isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)"}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(45, 212, 191, 0.25)"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>`;

a = a.replace(oldMileageChart, newMileageChart);
a = a.replace(oldMileageBar, newMileageBar);

// Update Top Cars Horizontal BarChart
const oldTopCarChart = `<BarChart 
                  layout="vertical" 
                  data={processedTopCars} 
                  margin={{ top: 5, right: 35, left: 110, bottom: 5 }}
                >`;
const newTopCarChart = `<BarChart 
                  layout="vertical" 
                  data={processedTopCars} 
                  margin={{ top: 5, right: 35, left: 110, bottom: 5 }}
                  onMouseMove={(state) => {
                    if (state && state.activeTooltipIndex !== undefined) {
                      setHoveredTopCarIdx(Number(state.activeTooltipIndex));
                    }
                  }}
                  onMouseLeave={() => setHoveredTopCarIdx(null)}
                >
                  <ChartDefs />`;

const oldTopCarBar = `<Bar 
                    dataKey="displayVal" 
                    radius={[0, 6, 6, 0]} 
                  >
                    {processedTopCars.map((entry) => (
                      <Cell
                        key={\`cell-top-\${entry.model}\`}
                        fill={entry.isRef ? CHART_COLORS.amber : CHART_COLORS.violet}
                      />
                    ))}
                  </Bar>`;

const newTopCarBar = `<Bar 
                    dataKey="displayVal" 
                    radius={[0, 8, 8, 0]} 
                    isAnimationActive={true}
                    animationDuration={650}
                    animationEasing="ease-out"
                  >
                    {processedTopCars.map((entry, idx) => {
                      const isHovered = hoveredTopCarIdx === idx;
                      const isAnyHovered = hoveredTopCarIdx !== null;
                      const fill = entry.isRef 
                        ? (isHovered ? "url(#amberHorizGradActive)" : "url(#amberHorizGrad)")
                        : (isHovered ? "url(#purpleHorizGradActive)" : "url(#purpleHorizGrad)");
                      const stroke = entry.isRef ? "#fbbf24" : "#c084fc";
                      return (
                        <Cell
                          key={\`cell-top-\${entry.model}\`}
                          fill={fill}
                          opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                          stroke={isHovered ? "rgba(255, 255, 255, 0.85)" : stroke}
                          strokeWidth={isHovered ? 1.5 : 1}
                          className="transition-all duration-200"
                        />
                      );
                    })}
                  </Bar>`;

a = a.replace(oldTopCarChart, newTopCarChart);
a = a.replace(oldTopCarBar, newTopCarBar);

// Update Regional Top 10 States BarChart
const oldRegionChart = `<BarChart data={topRegions.slice(0, 10)} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>`;
const newRegionChart = `<BarChart 
                data={topRegions.slice(0, 10)} 
                margin={{ top: 10, right: 10, left: -10, bottom: 25 }}
                onMouseMove={(state) => {
                  if (state && state.activeTooltipIndex !== undefined) {
                    setHoveredRegionIdx(Number(state.activeTooltipIndex));
                  }
                }}
                onMouseLeave={() => setHoveredRegionIdx(null)}
              >
                <ChartDefs />`;

const oldRegionBar = `<Bar dataKey="count" fill={CHART_COLORS.teal} radius={[6, 6, 0, 0]} />`;
const newRegionBar = `<Bar 
                  dataKey="count" 
                  radius={[8, 8, 0, 0]} 
                  isAnimationActive={true}
                  animationDuration={650}
                  animationEasing="ease-out"
                >
                  {topRegions.slice(0, 10).map((_, index) => {
                    const isHovered = hoveredRegionIdx === index;
                    const isAnyHovered = hoveredRegionIdx !== null;
                    return (
                      <Cell
                        key={\`cell-reg-\${index}\`}
                        fill={isHovered ? "url(#tealBarGradActive)" : "url(#tealBarGrad)"}
                        opacity={!isAnyHovered || isHovered ? 1 : 0.45}
                        stroke={isHovered ? "rgba(255, 255, 255, 0.75)" : "rgba(45, 212, 191, 0.25)"}
                        strokeWidth={isHovered ? 1.5 : 1}
                        className="transition-all duration-200"
                      />
                    );
                  })}
                </Bar>`;

a = a.replace(oldRegionChart, newRegionChart);
a = a.replace(oldRegionBar, newRegionBar);

fs.writeFileSync('frontend/src/app/analytics/page.tsx', a, 'utf8');
console.log('Successfully updated analytics page charts with dynamic gradients and hover states');

