# Better Charts Implementation Guide

Three chart types to enhance data visualization in FretGym.

---

## 1. Multiple Students' Progress Comparison (Teacher Dashboard)

**What it shows:** Compare BPM progression across multiple students on a single chart.

**Where:** New tab or section in TeacherDashboard (next to student list).

### Data Structure
```typescript
interface StudentChartData {
  date: string;
  [studentName: string]: number; // BPM for that date
}

// Example:
[
  { date: "Jan 1", "Alice": 120, "Bob": 100, "Charlie": 95 },
  { date: "Jan 2", "Alice": 125, "Bob": 102, "Charlie": 98 },
]
```

### Implementation Steps

1. **Add filter in TeacherDashboard**
   - Checkboxes to select which students to compare
   - Date range picker (last 4 weeks / last 3 months / all time)
   - Exercise filter (compare on same exercise)

2. **Query data from Supabase**
   ```typescript
   const loadComparisonData = async (studentIds: string[], exerciseId: string) => {
     // For each student, get their sessions with that exercise
     // Extract BPM progression
     // Transform to multi-series format
   };
   ```

3. **Render with Recharts ComposedChart**
   ```tsx
   <ComposedChart data={comparisonData}>
     <XAxis dataKey="date" />
     <YAxis />
     {selectedStudents.map((student) => (
       <Line
         key={student.id}
         type="monotone"
         dataKey={student.name}
         stroke={student.color} // Assign unique color
         strokeWidth={2}
         dot={{ r: 4 }}
       />
     ))}
     <Legend />
   </ComposedChart>
   ```

### Effort: Medium (1-2 days)
- Query transformation: 4-6 hours
- UI filters: 2-3 hours
- Chart integration: 1-2 hours

---

## 2. BPM Improvement Curves with Trend Lines (Student Detail)

**What it shows:** Clear visual trend of BPM progress with a "direction" line overlaid.

**Where:** Enhance existing AreaChart in StudentDetail Progress tab.

### Implementation Approach

#### Option A: Linear Regression (Simple)
Calculate a best-fit line through the data points.

```typescript
const calculateTrendLine = (data: { date: string; bpm: number }[]) => {
  const n = data.length;
  if (n < 2) return null;

  // Linear regression: y = mx + b
  const indices = data.map((_, i) => i);
  const bpms = data.map(d => d.bpm);

  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = bpms.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * bpms[i], 0);
  const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate points for the trend line
  return data.map((d, i) => ({
    date: d.date,
    trend: slope * i + intercept,
  }));
};
```

#### Option B: Moving Average (Smoothed)
Simpler, shows smoothed progression.

```typescript
const calculateMovingAverage = (data: { bpm: number }[], window = 3) => {
  return data.map((_, i) => {
    const start = Math.max(0, i - Math.floor(window / 2));
    const end = Math.min(data.length, i + Math.ceil(window / 2));
    const avg = data
      .slice(start, end)
      .reduce((sum, d) => sum + d.bpm, 0) / (end - start);
    return avg;
  });
};
```

### Chart Implementation

```tsx
const trendData = calculateTrendLine(chartData);

<AreaChart data={chartData}>
  <XAxis dataKey="date" />
  <YAxis domain={[minBpm, maxBpm]} />
  
  {/* Original area */}
  <Area
    type="monotone"
    dataKey="bpm"
    fill="url(#bpmGradient)"
    stroke="#22c55e"
    isAnimationActive={false}
  />
  
  {/* Trend line */}
  <Line
    type="monotone"
    dataKey="trend"
    stroke="#22c55e"
    strokeWidth={3}
    strokeDasharray="5 5"
    dot={false}
    isAnimationActive={false}
  />
  
  <Tooltip />
</AreaChart>
```

### Stats Below Chart
```tsx
const improvement = chartData[chartData.length - 1].bpm - chartData[0].bpm;
const trend = trendData 
  ? trendData[trendData.length - 1].trend - trendData[0].trend 
  : 0;

<div className="grid grid-cols-3 gap-4 mt-6">
  <div>
    <p className="text-xs text-muted-foreground">Total Gain</p>
    <p className={`text-xl font-bold ${improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
      +{improvement} BPM
    </p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Trend</p>
    <p className={`text-xl font-bold ${trend > 0 ? 'text-green-400' : 'text-red-400'}`}>
      {trend > 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(1)} BPM/week
    </p>
  </div>
  <div>
    <p className="text-xs text-muted-foreground">Sessions</p>
    <p className="text-xl font-bold">{chartData.length}</p>
  </div>
</div>
```

### Effort: Low (4-6 hours)
- Trend calculation: 1-2 hours
- Chart update: 1-2 hours
- Stats display: 1 hour

---

## 3. Consistency Heatmap (Student Detail / Teacher View)

**What it shows:** Practice frequency pattern—which days/times students practice most.

**Where:** New section in StudentDetail, or overlay in TeacherDashboard.

### Data Structure
```typescript
// By day of week
interface DayHeatmap {
  day: "Mon" | "Tue" | ... | "Sun";
  count: number; // sessions this day
}

// By time of day
interface TimeHeatmap {
  hour: number; // 0-23
  count: number; // sessions at this hour
}

// Full 2D heatmap (optional, more complex)
interface FullHeatmap {
  dayOfWeek: number;
  hour: number;
  count: number;
}
```

### Simple Implementation: Bar Charts

```tsx
// Day of week distribution
const daySessionCounts = [
  { day: "Mon", count: 2 },
  { day: "Tue", count: 4 },
  { day: "Wed", count: 1 },
  // ...
];

<BarChart data={daySessionCounts} height={200}>
  <XAxis dataKey="day" />
  <YAxis />
  <Bar 
    dataKey="count" 
    fill="#22c55e"
    radius={[8, 8, 0, 0]}
  />
</BarChart>

// Time of day distribution
const timeSessionCounts = [
  { hour: "6am", count: 0 },
  { hour: "7am", count: 2 },
  { hour: "8am", count: 5 },
  // ...
];

<BarChart data={timeSessionCounts} height={200}>
  <XAxis dataKey="hour" />
  <YAxis />
  <Bar 
    dataKey="count" 
    fill="#3b82f6"
    radius={[8, 8, 0, 0]}
  />
</BarChart>
```

### Advanced Implementation: Grid Heatmap (Using Recharts ScatterChart)

```tsx
// Transform data to heatmap format
const heatmapData = sessions.reduce((acc, s) => {
  const date = new Date(s.created_at);
  const dayOfWeek = date.getDay();
  const hour = date.getHours();
  
  const existing = acc.find(h => h.dayOfWeek === dayOfWeek && h.hour === hour);
  if (existing) {
    existing.count += 1;
  } else {
    acc.push({ dayOfWeek, hour, count: 1 });
  }
  return acc;
}, []);

// Color scale
const getColor = (count: number, max: number) => {
  const intensity = count / max;
  if (intensity < 0.25) return "#1e293b"; // dark
  if (intensity < 0.5) return "#334155"; // darker
  if (intensity < 0.75) return "#22c55e"; // green
  return "#16a34a"; // bright green
};

// Render as grid
<div className="grid grid-cols-7 gap-1">
  {Array.from({ length: 7 }).map((_, day) => (
    <div key={day} className="space-y-1">
      <p className="text-xs text-muted-foreground text-center font-bold">
        {"MonTueWedThuFriSatSun".slice(day * 3, day * 3 + 3)}
      </p>
      {Array.from({ length: 24 }).map((_, hour) => {
        const cell = heatmapData.find(h => h.dayOfWeek === day && h.hour === hour);
        const count = cell?.count || 0;
        const maxCount = Math.max(...heatmapData.map(h => h.count), 1);
        
        return (
          <div
            key={`${day}-${hour}`}
            className="w-6 h-6 rounded text-xs flex items-center justify-center"
            title={`${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][day]} ${hour}:00 - ${count} sessions`}
            style={{ backgroundColor: getColor(count, maxCount) }}
          >
            {count > 0 ? count : ""}
          </div>
        );
      })}
    </div>
  ))}
</div>
```

### Data Query
```typescript
const loadHeatmapData = async (studentId: string, timeRange = 30) => {
  const { data: sessions } = await supabase
    .from("sessions")
    .select("created_at")
    .eq("user_id", studentId)
    .gte("created_at", new Date(Date.now() - timeRange * 86400000).toISOString());
  
  return sessions || [];
};
```

### Effort: Medium (6-8 hours)
- Day/time aggregation: 2 hours
- Simple bar charts: 2 hours
- Advanced grid heatmap: 2-4 hours

---

## Integration Roadmap

### Phase 1 (Week 1): Low-hanging fruit
1. **Trend lines** (StudentDetail) — 4-6 hours, huge visual impact
2. **Day/time bars** (StudentDetail) — 4-6 hours, shows practice patterns

### Phase 2 (Week 2): Teacher tools
3. **Multi-student comparison** (TeacherDashboard) — 8-12 hours
4. **Heatmap grid** (StudentDetail) — 6-8 hours, optional polish

---

## Tech Notes

- **Recharts:** Already in dependencies, use `ComposedChart`, `Line`, `Area`, `Bar`
- **Data transform:** Do in React, not SQL (easier to iterate)
- **Performance:** Cache heatmap calculations, regenerate weekly
- **Colors:** Use existing brand palette (green #22c55e for primary)
- **Responsive:** Use `ResponsiveContainer` to scale with viewport

