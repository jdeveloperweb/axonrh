import { api } from './client';

export interface BrandingData {
    logoUrl?: string;
    logoWidth?: number;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    fontFamily: string;
    baseFontSize: number;
}

export const settingsApi = {
    getBranding: () => api.get<BrandingData, BrandingData>('/setup/steps/4'),
    saveBranding: (data: BrandingData) => api.post<void, void>('/setup/steps/4/save', data),
};
