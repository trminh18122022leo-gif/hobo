'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isClient, setIsClient] = useState(false);
  
  const [formData, setFormData] = useState({
    gpa: '',
    gpaScale: '4.0',
    degreeLevel: 'Đại học',
    fieldCodes: [] as string[],
    achievements: [] as string[],
    consent: false
  });

  useEffect(() => {
    setIsClient(true);
    // Check auth, redirect if not logged in
    fetch('/api/auth/me').then(res => res.json()).then(data => {
      if (!data.success || !data.data) {
        router.push('/dang-nhap');
      }
    });

    const saved = localStorage.getItem('profile_draft');
    if (saved) {
      try { setFormData(JSON.parse(saved)); } catch (e) {}
    }
  }, [router]);

  useEffect(() => {
    if (isClient) localStorage.setItem('profile_draft', JSON.stringify(formData));
  }, [formData, isClient]);

  if (!isClient) return null;

  const handleSubmit = async () => {
    if (!formData.consent) {
      alert('Vui lòng đồng ý với điều khoản sử dụng');
      return;
    }
    
    try {
      // await fetch('/api/profile', { method: 'POST', body: JSON.stringify(formData) });
      localStorage.removeItem('profile_draft');
      router.push('/goi-y');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8 text-slate-900 dark:text-white">Hồ sơ của bạn</h1>
      
      <div className="mb-8 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
        <div 
          className="bg-primary-600 h-full transition-all duration-300" 
          style={{ width: `${(step / 3) * 100}%` }}
        ></div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">1. Thông tin cơ bản</h2>
            <div>
              <label htmlFor="gpa" className="block text-sm font-medium mb-1">GPA</label>
              <input 
                id="gpa" type="number" step="0.01" 
                value={formData.gpa} onChange={e => setFormData({...formData, gpa: e.target.value})}
                className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label htmlFor="gpaScale" className="block text-sm font-medium mb-1">Thang điểm</label>
              <select 
                id="gpaScale"
                value={formData.gpaScale} onChange={e => setFormData({...formData, gpaScale: e.target.value})}
                className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="4.0">4.0</option>
                <option value="10.0">10.0</option>
              </select>
            </div>
            <button onClick={() => setStep(2)} className="w-full p-3 bg-primary-600 text-white rounded-lg">Tiếp tục</button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">2. Ngành học quan tâm</h2>
            <div>
              <label htmlFor="degreeLevel" className="block text-sm font-medium mb-1">Cấp học</label>
              <select 
                id="degreeLevel"
                value={formData.degreeLevel} onChange={e => setFormData({...formData, degreeLevel: e.target.value})}
                className="w-full p-3 border rounded-lg dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Đại học">Đại học</option>
                <option value="Thạc sĩ">Thạc sĩ</option>
                <option value="Tiến sĩ">Tiến sĩ</option>
              </select>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="w-1/3 p-3 bg-slate-200 dark:bg-slate-700 rounded-lg">Quay lại</button>
              <button onClick={() => setStep(3)} className="w-2/3 p-3 bg-primary-600 text-white rounded-lg">Tiếp tục</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">3. Xác nhận</h2>
            <label className="flex items-start gap-3 p-4 border rounded-lg dark:border-slate-700">
              <input 
                type="checkbox" 
                className="mt-1"
                checked={formData.consent} 
                onChange={e => setFormData({...formData, consent: e.target.checked})}
              />
              <span className="text-sm">Tôi đồng ý cho phép xử lý dữ liệu cá nhân để nhận gợi ý học bổng, theo quy định tại Nghị định 13/2023/NĐ-CP.</span>
            </label>
            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="w-1/3 p-3 bg-slate-200 dark:bg-slate-700 rounded-lg">Quay lại</button>
              <button onClick={handleSubmit} className="w-2/3 p-3 bg-primary-600 text-white rounded-lg font-bold">Hoàn tất & Nhận gợi ý</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
