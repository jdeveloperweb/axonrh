'use client';

import React from 'react';
import { Employee } from '@/lib/api/employees';
import { ThemeConfig } from '@/lib/api/config';
import { formatDate, getPhotoUrl } from '@/lib/utils';
import Image from 'next/image';

interface EmployeeBadgeProps {
    employee: Employee;
    colors?: {
        primary: string;
        secondary: string;
        accent: string;
    };
    companyLogo?: string;
}

export const EmployeeBadge: React.FC<EmployeeBadgeProps> = ({ employee, colors, companyLogo }) => {
    const primaryColor = colors?.primary || '#4F46E5';
    const secondaryColor = colors?.secondary || primaryColor;
    const accentColor = colors?.accent || primaryColor;

    return (
        <div
            id="employee-badge"
            className="relative overflow-hidden bg-white shadow-2xl"
            style={{
                width: '320px',
                height: '500px',
                borderRadius: '16px',
                fontFamily: 'var(--font-primary), sans-serif',
            }}
        >
            {/* Decorative Background Elements */}
            <div
                className="absolute top-0 left-0 w-full h-40 opacity-20"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                    clipPath: 'polygon(0 0, 100% 0, 100% 70%, 0 100%)'
                }}
            />

            <div
                className="absolute top-4 right-4 w-24 h-24 opacity-10"
                style={{
                    background: secondaryColor,
                    borderRadius: '24% 76% 35% 65% / 49% 30% 70% 51%',
                    transform: 'rotate(45deg)'
                }}
            />

            {/* Header / Logo */}
            <div className="relative pt-10 px-8 flex flex-col items-center">
                {companyLogo ? (
                    <div className="h-12 flex items-center justify-center mb-4">
                        <img
                            src={companyLogo}
                            alt="Logo"
                            className="max-h-full max-w-[200px] object-contain"
                            crossOrigin="anonymous"
                        />
                    </div>
                ) : (
                    <div className="h-12 flex items-center gap-2 mb-4">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`
                            }}
                        >
                            A
                        </div>
                        <span className="font-extrabold text-2xl tracking-tighter text-gray-800">AxonRH</span>
                    </div>
                )}
            </div>

            {/* Profile Photo */}
            <div className="relative mt-2 flex justify-center">
                <div className="relative">
                    <div
                        className="absolute -inset-1.5 rounded-3xl blur-md opacity-30"
                        style={{ backgroundColor: primaryColor }}
                    />
                    <div
                        className="relative w-40 h-40 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-gray-50"
                        style={{ borderColor: 'white' }}
                    >
                        {employee.photoUrl ? (
                            <img
                                src={getPhotoUrl(employee.photoUrl, employee.updatedAt) || ''}
                                alt={employee.fullName}
                                className="w-full h-full object-cover"
                                crossOrigin="anonymous"
                            />
                        ) : (
                            <div
                                className="w-full h-full flex items-center justify-center text-6xl font-bold text-white"
                                style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                            >
                                {employee.fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Employee Info */}
            <div className="mt-6 px-8 text-center">
                <h2 className="text-2xl font-black text-gray-900 leading-tight uppercase tracking-tight">
                    {employee.socialName || employee.fullName}
                </h2>
                <div
                    className="mt-1.5 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm"
                    style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                        border: `1px solid ${primaryColor}30`
                    }}
                >
                    {employee.position?.title || employee.position?.name || 'Colaborador'}
                </div>
                <p className="text-xs text-gray-400 font-bold mt-2 uppercase tracking-widest">
                    {employee.department?.name || ''}
                </p>
            </div>

            {/* Badge Details */}
            <div className="mt-8 px-10 grid grid-cols-2 gap-y-1">
                <div>
                    <p className="text-[10px] uppercase font-black text-gray-300 tracking-widest">ID Matrícula</p>
                    <p className="text-lg font-black text-gray-800" style={{ color: '#1a1a1a' }}>
                        {employee.registrationNumber || '-'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] uppercase font-black text-gray-300 tracking-widest">Admissão</p>
                    <p className="text-lg font-black text-gray-800">
                        {(employee.hireDate || employee.admissionDate) ? formatDate(employee.hireDate || employee.admissionDate!) : '-'}
                    </p>
                </div>
            </div>

            {/* Footer / Barcode decoration */}
            <div className="absolute bottom-0 left-0 w-full">
                <div
                    className="h-3 w-full"
                    style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor}, ${accentColor})` }}
                />
                <div className="p-4 bg-white flex flex-col items-center">
                    <div className="flex gap-1.5 h-10 items-end opacity-20">
                        {[2, 4, 1, 3, 2, 5, 2, 4, 1, 6, 2, 3, 1, 4, 2, 3, 5, 1, 4].map((h, i) => (
                            <div
                                key={i}
                                className="bg-black"
                                style={{ width: '2px', height: `${h * 4}px`, borderRadius: '1px' }}
                            />
                        ))}
                    </div>
                    <p className="text-[9px] font-black text-gray-300 mt-2 uppercase tracking-[0.3em]">
                        Identidade Corporativa • AxonRH
                    </p>
                </div>
            </div>
        </div>
    );
};
