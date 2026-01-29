'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';

interface ImageCropDialogProps {
    image: string;
    onComplete: (croppedImage: Blob) => void;
    onCancel: () => void;
    aspectRatio?: number;
}

interface Area {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface CropArea extends Area { }

export function ImageCropDialog({
    image,
    onComplete,
    onCancel,
    aspectRatio = 1,
}: ImageCropDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
    const [loading, setLoading] = useState(false);

    const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: CropArea) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const createCroppedImage = useCallback(async () => {
        if (!croppedAreaPixels) return;

        setLoading(true);
        try {
            const croppedImage = await getCroppedImg(image, croppedAreaPixels);
            onComplete(croppedImage);
        } catch (e) {
            console.error('Error cropping image:', e);
        } finally {
            setLoading(false);
        }
    }, [image, croppedAreaPixels, onComplete]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-[var(--color-text)]">
                        Recortar Foto
                    </h2>
                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Crop Area */}
                <div className="relative h-96 bg-gray-900">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        cropShape="round"
                        showGrid={false}
                    />
                </div>

                {/* Controls */}
                <div className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--color-text)]">
                            Zoom
                        </label>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[var(--color-primary)]"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2.5 border border-gray-300 text-[var(--color-text)] rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={createCroppedImage}
                            disabled={loading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-opacity font-medium disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Salvar Foto
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function to crop the image
async function getCroppedImg(imageSrc: string, pixelCrop: CropArea): Promise<Blob> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('No 2d context');
    }

    // Set canvas size to match the cropped area
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
    );

    // Convert canvas to blob
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (!blob) {
                reject(new Error('Canvas is empty'));
                return;
            }
            resolve(blob);
        }, 'image/jpeg', 0.95);
    });
}

// Helper function to create an image element
function createImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });
}
