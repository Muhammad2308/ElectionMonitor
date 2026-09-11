import { v4 as uuidv4 } from 'uuid';

export const getDeviceId = (): string => {
    let deviceId = localStorage.getItem('eip_device_id');
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem('eip_device_id', deviceId);
    }
    return deviceId;
};

export const getDeviceFingerprint = () => {
    return {
        id: getDeviceId(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
    };
};
