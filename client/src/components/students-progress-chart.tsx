import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface StudentsProgressChartProps {
  data: {
    name: string;
    value: number;
    fill: string;
  }[];
}

export function StudentsProgressChart({ data }: StudentsProgressChartProps) {
  const maleData = data.find(d => d.name.toLowerCase() === 'male');
  const femaleData = data.find(d => d.name.toLowerCase() === 'female');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="70%"
              outerRadius="100%"
              data={data}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
                isAnimationActive={false}
              />
              <Tooltip formatter={(value: number) => `${value}%`} />
            </RadialBarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center space-x-4 mt-4">
          {maleData && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-primary mr-2"></div>
              <span>Male: {maleData.value}%</span>
            </div>
          )}
          {femaleData && (
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-secondary mr-2"></div>
              <span>Female: {femaleData.value}%</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
