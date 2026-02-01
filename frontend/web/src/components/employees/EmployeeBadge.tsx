'use client';

import React from 'react';
import { Employee } from '@/lib/api/employees';
import { ThemeConfig } from '@/lib/api/config';
import { formatDate, getPhotoUrl } from '@/lib/utils';
import Image from 'next/image';

interface EmployeeBadgeProps {
    employee: Employee;
    theme?: ThemeConfig;
    companyLogo?: string;
}

export const EmployeeBadge: React.FC<EmployeeBadgeProps> = ({ employee, theme, companyLogo }) => {
    const primaryColor = theme?.primaryColor || '#4F46E5';

    return (
        <div
            id="employee-badge"
            className="relative overflow-hidden bg-white shadow-2xl"
            style={{
                width: '320px', // Scaling up for better quality when capturing
                height: '500px',
                borderRadius: '16px',
                fontFamily: 'var(--font-primary), sans-serif',
            }}
        >
            {/* Decorative Background Elements */}
            <div
                className="absolute top-0 left-0 w-full h-32 opacity-20"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, transparent 100%)`,
                    clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)'
                }}
            />

            <div
                className="absolute top-0 right-0 w-32 h-32 opacity-10"
                style={{
                    background: primaryColor,
                    borderRadius: '50%',
                    transform: 'translate(40%, -40%)'
                }}
            />

            {/* Header / Logo */}
            <div className="relative pt-8 px-8 flex flex-col items-center">
                {companyLogo ? (
                    <img
                        src={companyLogo}
                        alt="Logo"
                        className="h-10 object-contain mb-4"
                    />
                ) : (
                    <div className="h-10 flex items-center gap-2 mb-4">
                        <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                            style={{ backgroundColor: primaryColor }}
                        >
                            A
                        </div>
                        <span className="font-bold text-xl tracking-tight text-gray-800">AxonRH</span>
                    </div>
                )}
            </div>

            {/* Profile Photo */}
            <div className="relative mt-4 flex justify-center">
                <div className="relative">
                    <div
                        className="absolute -inset-1 rounded-2xl blur-sm opacity-25"
                        style={{ backgroundColor: primaryColor }}
                    />
                    <div className="relative w-36 h-36 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-gray-50">
                        {employee.photoUrl ? (
                            <img
                                src={getPhotoUrl(employee.photoUrl, employee.updatedAt) || ''}
                                alt={employee.fullName}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div
                                className="w-full h-full flex items-center justify-center text-5xl font-bold text-white"
                                style={{ backgroundColor: primaryColor }}
                            >
                                {employee.fullName.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Employee Info */}
            <div className="mt-6 px-8 text-center">
                <h2 className="text-xl font-extrabold text-gray-900 leading-tight">
                    {employee.socialName || employee.fullName}
                </h2>
                <p
                    className="mt-1 text-sm font-semibold uppercase tracking-wider"
                    style={{ color: primaryColor }}
                >
                    {employee.position?.title || employee.position?.name || 'Colaborador'}
                </p>
                <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {employee.department?.name || ''}
                </p>
            </div>

            {/* Badge Details */}
            <div className="mt-8 px-10 grid grid-cols-2 gap-y-4">
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Matrícula</p>
                    <p className="text-sm font-bold text-gray-800">#{employee.registrationNumber || '-'}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-right">Admissão</p>
                    <p className="text-sm font-bold text-gray-800 text-right">
                        {(employee.hireDate || employee.admissionDate) ? formatDate(employee.hireDate || employee.admissionDate!) : '-'}
                    </p>
                </div>
            </div>

            {/* Footer / Barcode decoration */}
            <div className="absolute bottom-0 left-0 w-full">
                <div
                    className="h-2 w-full"
                    style={{ backgroundColor: primaryColor }}
                />
                <div className="p-4 bg-gray-50 flex flex-col items-center">
                    <div className="flex gap-1 h-8 items-end opacity-40">
                        {[2, 4, 1, 3, 2, 5, 2, 4, 1, 6, 2, 3, 1, 4, 2].map((h, i) => (
                            <div
                                key={i}
                                className="bg-black mb-1"
                                style={{ width: '2px', height: `${h * 4}px` }}
                            />
                        ))}
                    </div>
                    <p className="text-[8px] font-mono text-gray-400 mt-1 uppercase">
                        Identidade Funcional Digital • AxonRH System
                    </p>
                </div>
            </div>
        </div>
    );
};
