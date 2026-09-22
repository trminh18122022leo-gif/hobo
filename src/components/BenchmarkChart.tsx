'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  ComposedChart,
} from 'recharts';
import { HistoricalBenchmarkEntry } from '@/types';
import { Info, TrendUp } from '@phosphor-icons/react';

interface BenchmarkChartProps {
  data: HistoricalBenchmarkEntry[];
  title?: string;
}

export default function BenchmarkChart({ data, title = 'Xu hướng điểm chuẩn & Tỷ lệ cạnh tranh' }: BenchmarkChartProps) {
  if (!data || data.length < 3) {
    return (
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center text-slate-500 dark:text-slate-400">
        <Info size={28} className="mx-auto mb-2 text-slate-400" />
        <p className="text-sm font-medium">Chưa đủ dữ liệu lịch sử tối thiểu (cần ít nhất 3 năm)</p>
        <p className="text-xs text-slate-400 mt-1">Dữ liệu sẽ tự động mở khi tích luỹ đủ các kỳ tuyển sinh trước đó.</p>
      </div>
    );
  }

  // Sắp xếp theo năm tăng dần
  const sorted = [...data].sort((a, b) => a.year - b.year);

  // Tính hồi quy tuyến tính cho điểm chuẩn (Linear Regression: y = ax + b)
  const validScores = sorted.filter((d) => typeof d.benchmarkScore === 'number' && d.benchmarkScore !== null);
  const n = validScores.length;

  let slope = 0;
  let intercept = 0;

  if (n >= 2) {
    const sumX = validScores.reduce((sum, d) => sum + d.year, 0);
    const sumY = validScores.reduce((sum, d) => sum + (d.benchmarkScore || 0), 0);
    const sumXY = validScores.reduce((sum, d) => sum + d.year * (d.benchmarkScore || 0), 0);
    const sumXX = validScores.reduce((sum, d) => sum + d.year * d.year, 0);

    slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    intercept = (sumY - slope * sumX) / n;
  }

  // Dự phóng cho năm tiếp theo
  const nextYear = sorted[sorted.length - 1].year + 1;
  const projectedScore = slope !== 0 ? +(slope * nextYear + intercept).toFixed(2) : null;

  // Chuẩn bị dữ liệu hiển thị
  const chartData = sorted.map((d) => {
    const ratio =
      d.applicantCount && d.quota && d.quota > 0
        ? +(d.applicantCount / d.quota).toFixed(1)
        : d.competitionRatio || null;

    const trend = slope !== 0 ? +(slope * d.year + intercept).toFixed(2) : null;

    return {
      year: `${d.year}`,
      diemChuan: d.benchmarkScore ?? null,
      duPhong: trend,
      tyLeChoi: ratio,
      chiTieu: d.quota ?? null,
      hoSo: d.applicantCount ?? null,
    };
  });

  // Thêm điểm dự phóng tương lai
  if (projectedScore !== null) {
    chartData.push({
      year: `${nextYear} (Dự phóng)`,
      diemChuan: null,
      duPhong: projectedScore,
      tyLeChoi: null,
      chiTieu: null,
      hoSo: null,
    });
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6 gap-2">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendUp size={22} className="text-primary-600" />
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Phân tích dữ liệu qua {sorted.length} năm học gần nhất
          </p>
        </div>
        {projectedScore && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold">
            <span>Dự phóng {nextYear}: ~{projectedScore} điểm</span>
          </div>
        )}
      </div>

      {/* Biểu đồ kết hợp */}
      <div className="w-full h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis
              yAxisId="score"
              domain={['auto', 'auto']}
              tick={{ fontSize: 12, fill: '#64748b' }}
              label={{ value: 'Điểm', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }}
            />
            <YAxis
              yAxisId="ratio"
              orientation="right"
              domain={[0, 'auto']}
              tick={{ fontSize: 12, fill: '#64748b' }}
              label={{ value: 'Tỷ lệ chọi (1:X)', angle: 90, position: 'insideRight', fill: '#94a3b8', fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                borderColor: '#334155',
                color: '#fff',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
            <Bar
              yAxisId="ratio"
              dataKey="tyLeChoi"
              name="Tỷ lệ chọi (1:X)"
              fill="#93c5fd"
              radius={[4, 4, 0, 0]}
              maxBarSize={36}
            />
            <Line
              yAxisId="score"
              type="monotone"
              dataKey="diemChuan"
              name="Điểm chuẩn thực tế"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 5, fill: '#2563eb' }}
              activeDot={{ r: 7 }}
            />
            <Line
              yAxisId="score"
              type="monotone"
              dataKey="duPhong"
              name="Dải xu hướng (Hồi quy)"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 4, fill: '#f59e0b' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Ranh giới bắt buộc & Miễn trừ trách nhiệm theo Tài liệu v2.1 Mục B.3 */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <strong>Tuyên bố minh bạch:</strong> Xu hướng tham khảo dựa trên dữ liệu quá khứ, không phải cam kết tuyển sinh chính thức của nhà trường. Thí sinh cần theo dõi đề án tuyển sinh hàng năm để có thông tin chính xác nhất.
        </div>
      </div>
    </div>
  );
}
