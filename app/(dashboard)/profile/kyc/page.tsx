'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopHeader from '@/components/layout/TopHeader';

type KycStep = 1 | 2 | 3 | 4;

export default function KycVerificationPage() {
    const router = useRouter();
    const [step, setStep] = useState<KycStep>(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form data
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        nationality: '',
        idType: 'passport',
        idNumber: '',
    });

    // File uploads (mock references)
    const [idFront, setIdFront] = useState<File | null>(null);
    const [idBack, setIdBack] = useState<File | null>(null);
    const [selfie, setSelfie] = useState<File | null>(null);

    const handleNext = () => setStep(s => Math.min(s + 1, 4) as KycStep);
    const handlePrev = () => setStep(s => Math.max(s - 1, 1) as KycStep);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        // Mock API call delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsSubmitting(false);
        setStep(4); // Success step
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (file: File | null) => void) => {
        if (e.target.files && e.target.files.length > 0) {
            setter(e.target.files[0]);
        }
    };

    return (
        <div>
            <TopHeader title="Identity Verification" subtitle="Complete KYC to unlock full trading limits" />

            <div className="max-w-2xl mx-auto py-8 px-6">

                {/* Progress Bar */}
                {step < 4 && (
                    <div className="mb-8">
                        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-2 px-1">
                            <span className={step >= 1 ? 'text-[var(--color-gold-primary)] font-bold' : ''}>1. Personal Info</span>
                            <span className={step >= 2 ? 'text-[var(--color-gold-primary)] font-bold' : ''}>2. Identity Docs</span>
                            <span className={step >= 3 ? 'text-[var(--color-gold-primary)] font-bold' : ''}>3. Face Match</span>
                        </div>
                        <div className="h-1.5 bg-[var(--color-bg-input)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-[var(--color-gold-primary)] transition-all duration-300"
                                style={{ width: `${((step - 1) / 2) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="card p-6 lg:p-8">
                    {/* Step 1: Personal Info */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[var(--color-gold-primary)]/20 text-[var(--color-gold-primary)] text-sm flex items-center justify-center">1</span>
                                Personal Information
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">First Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. John"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">Last Name</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Doe"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">Date of Birth</label>
                                    <input
                                        type="date"
                                        className="input-field"
                                        style={{ colorScheme: 'dark' }}
                                        value={formData.dateOfBirth}
                                        onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">Nationality</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. United States"
                                        value={formData.nationality}
                                        onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                                    />
                                </div>
                            </div>

                            <hr className="border-[var(--color-border)] my-6" />

                            <h3 className="text-base font-bold mb-4">Identity Document</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">Document Type</label>
                                    <select
                                        className="input-field cursor-pointer"
                                        value={formData.idType}
                                        onChange={e => setFormData({ ...formData, idType: e.target.value })}
                                    >
                                        <option value="passport">Passport</option>
                                        <option value="id_card">National ID Card</option>
                                        <option value="driver_license">Driver's License</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-[var(--color-text-secondary)] mb-1.5">ID Number</label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Enter ID number"
                                        value={formData.idNumber}
                                        onChange={e => setFormData({ ...formData, idNumber: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                className="btn-gold w-full flex justify-center items-center gap-2"
                                onClick={handleNext}
                                disabled={!formData.firstName || !formData.lastName || !formData.idNumber}
                                style={{ opacity: (!formData.firstName || !formData.lastName || !formData.idNumber) ? 0.5 : 1 }}
                            >
                                Continue to Document Upload
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    )}

                    {/* Step 2: Document Upload */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[var(--color-gold-primary)]/20 text-[var(--color-gold-primary)] text-sm flex items-center justify-center">2</span>
                                Upload Identity Documents
                            </h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                Please upload clear photos of your {formData.idType.replace('_', ' ')}. Ensure all text is legible and edges are visible.
                            </p>

                            <div className="space-y-6 mb-8">
                                {/* Front Upload */}
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Front of Document</label>
                                    <div className="border border-dashed border-[var(--color-border)] rounded-lg p-6 text-center hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer relative"
                                        style={{ borderColor: idFront ? 'var(--color-green)' : 'var(--color-border)' }}>
                                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, setIdFront)} />
                                        {idFront ? (
                                            <div className="text-[var(--color-green)] flex flex-col items-center gap-2">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" /></svg>
                                                <span className="text-sm font-medium">{idFront.name}</span>
                                            </div>
                                        ) : (
                                            <div className="text-[var(--color-text-secondary)] flex flex-col items-center gap-2">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                                <span className="text-sm">Click to upload or drag and drop</span>
                                                <span className="text-xs text-[var(--color-text-muted)]">JPG, PNG, PDF up to 10MB</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Back Upload (Conditional) */}
                                {formData.idType !== 'passport' && (
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Back of Document</label>
                                        <div className="border border-dashed border-[var(--color-border)] rounded-lg p-6 text-center hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer relative"
                                            style={{ borderColor: idBack ? 'var(--color-green)' : 'var(--color-border)' }}>
                                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, setIdBack)} />
                                            {idBack ? (
                                                <div className="text-[var(--color-green)] flex flex-col items-center gap-2">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" /></svg>
                                                    <span className="text-sm font-medium">{idBack.name}</span>
                                                </div>
                                            ) : (
                                                <div className="text-[var(--color-text-secondary)] flex flex-col items-center gap-2">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                                                    <span className="text-sm">Click to upload or drag and drop</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button className="btn-outline-gold flex-1" onClick={handlePrev}>Back</button>
                                <button
                                    className="btn-gold flex-[2]"
                                    onClick={handleNext}
                                    disabled={!idFront || (formData.idType !== 'passport' && !idBack)}
                                    style={{ opacity: (!idFront || (formData.idType !== 'passport' && !idBack)) ? 0.5 : 1 }}
                                >
                                    Continue to Face Match
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Selfie / Face Match */}
                    {step === 3 && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-[var(--color-gold-primary)]/20 text-[var(--color-gold-primary)] text-sm flex items-center justify-center">3</span>
                                Face Verification
                            </h2>
                            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
                                Please upload a clear selfie of yourself. This is used to match your face with the identity document provided.
                            </p>

                            <div className="mb-8">
                                <div className="border border-dashed border-[var(--color-border)] rounded-lg p-10 text-center hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer relative"
                                    style={{ borderColor: selfie ? 'var(--color-green)' : 'var(--color-border)' }}>
                                    <input type="file" accept="image/*" capture="user" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleFileChange(e, setSelfie)} />
                                    {selfie ? (
                                        <div className="text-[var(--color-green)] flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-[var(--color-green)]/20 flex items-center justify-center">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                            </div>
                                            <span className="text-sm font-medium">{selfie.name}</span>
                                            <span className="text-xs text-[var(--color-text-secondary)] underline mt-1">Click to replace</span>
                                        </div>
                                    ) : (
                                        <div className="text-[var(--color-text-secondary)] flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 rounded-full bg-[var(--color-bg-input)] flex items-center justify-center text-[var(--color-text-muted)]">
                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                                            </div>
                                            <span className="text-sm">Click to take a selfie or upload photo</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[var(--color-bg-input)] p-4 rounded-lg mb-8 text-xs text-[var(--color-text-secondary)] flex gap-3">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-blue)] shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                <p>Your personal data and images are protected with end-to-end encryption and only used for identity verification purposes in compliance with global AML/KYC regulations.</p>
                            </div>

                            <div className="flex gap-4">
                                <button className="btn-outline-gold flex-[1]" onClick={handlePrev} disabled={isSubmitting}>Back</button>
                                <button
                                    className="btn-gold flex-[2] flex justify-center items-center gap-2"
                                    onClick={handleSubmit}
                                    disabled={!selfie || isSubmitting}
                                    style={{ opacity: (!selfie || isSubmitting) ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="block w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                            Submitting...
                                        </>
                                    ) : 'Submit Verification'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success / Pending */}
                    {step === 4 && (
                        <div className="text-center py-8 animate-in zoom-in duration-500">
                            <div className="w-20 h-20 mx-auto bg-[var(--color-gold-primary)]/20 rounded-full flex items-center justify-center text-[var(--color-gold-primary)] mb-6">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3" /></svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-[var(--color-gold-primary)]">Verification Submitted</h2>
                            <p className="text-[var(--color-text-secondary)] mb-8 max-w-sm mx-auto">
                                Your KYC application has been successfully submitted and is currently under review.
                                We will notify you once your account has been fully verified (usually within 24 hours).
                            </p>
                            <button
                                className="btn-gold w-full max-w-xs mx-auto"
                                onClick={() => router.push('/profile')}
                            >
                                Return to Profile
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
