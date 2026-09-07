import { create } from 'zustand';
import { validateLicenseKey } from '../core/license/validator';

const LICENSE_STORAGE_KEY = 'redactify_pro_license';

export const useLicenseStore = create((set, get) => {
  // Read saved license on boot
  let initialLicense = null;
  let isPro = false;

  try {
    const saved = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Verify key and expiry if present
      if (parsed?.key && validateLicenseKey(parsed.key).valid) {
        if (!parsed.expiresAt || new Date(parsed.expiresAt).getTime() > Date.now()) {
          initialLicense = parsed;
          isPro = true;
        }
      }
    }
  } catch (e) {
    // Ignore storage parse errors
  }

  return {
    isPro,
    license: initialLicense,
    showProModal: false,
    proModalFeature: '', // Reason prompting the modal: 'multi-page', 'batch', 'custom-style', etc.
    exportTrialCallback: null,

    openProModal: (featureReason = '', trialCallback = null) => set({
      showProModal: true,
      proModalFeature: featureReason,
      exportTrialCallback: trialCallback
    }),

    closeProModal: () => set({
      showProModal: false,
      proModalFeature: '',
      exportTrialCallback: null
    }),

    activateLicense: (licenseData) => {
      try {
        localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(licenseData));
      } catch (e) {}

      set({
        isPro: true,
        license: licenseData,
        showProModal: false
      });
    },

    deactivateLicense: () => {
      try {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
      } catch (e) {}

      set({
        isPro: false,
        license: null
      });
    }
  };
});
