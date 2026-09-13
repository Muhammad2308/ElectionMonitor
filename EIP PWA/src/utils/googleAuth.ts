const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

export const isGoogleSignInConfigured = (): boolean => Boolean(GOOGLE_CLIENT_ID);

declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: {
                        client_id: string;
                        callback: (response: { credential: string }) => void;
                    }) => void;
                    prompt: (
                        listener?: (notification: {
                            isNotDisplayed: () => boolean;
                            isSkippedMoment: () => boolean;
                            isDismissedMoment: () => boolean;
                            getNotDisplayedReason: () => string;
                            getDismissedReason: () => string;
                        }) => void
                    ) => void;
                };
            };
        };
    }
}

let scriptLoadPromise: Promise<void> | null = null;

const loadGoogleScript = (): Promise<void> => {
    if (window.google?.accounts?.id) return Promise.resolve();
    if (scriptLoadPromise) return scriptLoadPromise;

    scriptLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Could not reach Google. Check your connection and try again.'));
        document.head.appendChild(script);
    });

    return scriptLoadPromise;
};

/**
 * Triggers Google's sign-in flow from a custom-styled button and resolves
 * with the signed ID token (a JWT) for the backend to verify. Rejects with
 * a user-facing message on failure/dismissal so the caller can just show it.
 */
export const signInWithGoogle = async (): Promise<string> => {
    if (!GOOGLE_CLIENT_ID) {
        throw new Error('Google sign-in is not configured for this deployment yet.');
    }

    await loadGoogleScript();

    return new Promise((resolve, reject) => {
        window.google!.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
                if (response?.credential) {
                    resolve(response.credential);
                } else {
                    reject(new Error('Google did not return a sign-in response. Please try again.'));
                }
            },
        });

        window.google!.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                reject(new Error('Google sign-in was blocked or closed. Check your browser\'s third-party cookie / popup settings and try again.'));
            }
        });
    });
};
