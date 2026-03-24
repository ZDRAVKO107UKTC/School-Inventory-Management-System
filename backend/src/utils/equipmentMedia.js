const IMAGE_EXTENSIONS = new Set([
    'avif',
    'bmp',
    'gif',
    'heic',
    'heif',
    'jpeg',
    'jpg',
    'png',
    'svg',
    'webp'
]);

const DOCUMENT_EXTENSIONS = new Set([
    'doc',
    'docx',
    'odp',
    'ods',
    'odt',
    'pages',
    'pdf',
    'ppt',
    'pptx',
    'rtf',
    'txt',
    'xls',
    'xlsx'
]);

const EMPTY_PREVIEW = {
    photo_preview_url: null,
    photo_thumbnail_url: null,
    photo_preview_mode: null,
    photo_preview_provider: null
};

const buildEquipmentQrValue = (equipment) => {
    if (!equipment || equipment.id == null || !equipment.name || !equipment.type) {
        return null;
    }

    const lines = [
        'School Inventory Management System',
        `Equipment ID: ${equipment.id}`,
        `Name: ${equipment.name}`,
        `Type: ${equipment.type}`,
        `Status: ${equipment.status || 'unknown'}`
    ];

    if (equipment.serial_number) {
        lines.push(`Serial Number: ${equipment.serial_number}`);
    }

    if (equipment.location) {
        lines.push(`Location: ${equipment.location}`);
    }

    if (equipment.room?.name) {
        lines.push(`Room: ${equipment.room.name}`);
    }

    return lines.join('\n');
};

const safeParseUrl = (value) => {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmedValue = value.trim();
    if (!trimmedValue) {
        return null;
    }

    try {
        return new URL(trimmedValue);
    } catch (_error) {
        return null;
    }
};

const getFileExtension = (pathname = '') => {
    const lastSegment = pathname.split('/').pop() || '';
    const cleanedSegment = lastSegment.split('?')[0];
    const dotIndex = cleanedSegment.lastIndexOf('.');

    if (dotIndex === -1) {
        return '';
    }

    return cleanedSegment.slice(dotIndex + 1).toLowerCase();
};

const getDirectPreviewMetadata = (url) => {
    const extension = getFileExtension(url.pathname);

    if (IMAGE_EXTENSIONS.has(extension) || url.hostname.toLowerCase().endsWith('googleusercontent.com')) {
        return {
            photo_preview_url: url.toString(),
            photo_thumbnail_url: url.toString(),
            photo_preview_mode: 'image',
            photo_preview_provider: 'direct'
        };
    }

    if (DOCUMENT_EXTENSIONS.has(extension)) {
        return {
            photo_preview_url: url.toString(),
            photo_thumbnail_url: null,
            photo_preview_mode: 'iframe',
            photo_preview_provider: 'direct'
        };
    }

    return null;
};

const getCloudinaryThumbnailUrl = (url, isDocumentAsset) => {
    if (!url.pathname.includes('/image/upload/')) {
        return null;
    }

    const [prefix, suffix] = url.pathname.split('/image/upload/');
    if (!suffix || suffix.startsWith('s--')) {
        return null;
    }

    const thumbnailUrl = new URL(url.toString());
    const transformation = isDocumentAsset ? 'pg_1,f_auto,q_auto' : 'f_auto,q_auto';
    thumbnailUrl.pathname = `${prefix}/image/upload/${transformation}/${suffix}`;
    return thumbnailUrl.toString();
};

const getCloudinaryPreviewMetadata = (url) => {
    if (url.hostname.toLowerCase() !== 'res.cloudinary.com') {
        return null;
    }

    const extension = getFileExtension(url.pathname);
    const isDocumentAsset = DOCUMENT_EXTENSIONS.has(extension) || url.pathname.includes('/raw/upload/');
    const isImageAsset = url.pathname.includes('/image/upload/') && !isDocumentAsset;

    return {
        photo_preview_url: url.toString(),
        photo_thumbnail_url: isImageAsset ? url.toString() : getCloudinaryThumbnailUrl(url, isDocumentAsset),
        photo_preview_mode: isImageAsset ? 'image' : (isDocumentAsset ? 'iframe' : 'external'),
        photo_preview_provider: 'cloudinary'
    };
};

const getGooglePreviewMetadata = (url) => {
    const hostname = url.hostname.toLowerCase();

    if (hostname === 'drive.google.com') {
        const filePathMatch = url.pathname.match(/^\/file\/d\/([^/]+)/);
        const fileId = filePathMatch?.[1] || url.searchParams.get('id');

        if (!fileId) {
            return null;
        }

        return {
            photo_preview_url: `https://drive.google.com/file/d/${fileId}/preview`,
            photo_thumbnail_url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
            photo_preview_mode: 'iframe',
            photo_preview_provider: 'google-drive'
        };
    }

    if (hostname !== 'docs.google.com') {
        return null;
    }

    const documentMatch = url.pathname.match(/^\/(document|spreadsheets|presentation)\/d\/([^/]+)/);
    if (documentMatch) {
        const [, resourceType, fileId] = documentMatch;
        return {
            photo_preview_url: `https://docs.google.com/${resourceType}/d/${fileId}/preview`,
            photo_thumbnail_url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
            photo_preview_mode: 'iframe',
            photo_preview_provider: resourceType === 'document' ? 'google-docs' : 'google-workspace'
        };
    }

    if (url.pathname.startsWith('/uc')) {
        const fileId = url.searchParams.get('id');
        if (fileId) {
            return {
                photo_preview_url: `https://drive.google.com/file/d/${fileId}/preview`,
                photo_thumbnail_url: `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
                photo_preview_mode: 'iframe',
                photo_preview_provider: 'google-drive'
            };
        }
    }

    return null;
};

const getPhotoPreviewMetadata = (photoUrl) => {
    const parsedUrl = safeParseUrl(photoUrl);
    if (!parsedUrl) {
        return EMPTY_PREVIEW;
    }

    return getGooglePreviewMetadata(parsedUrl)
        || getCloudinaryPreviewMetadata(parsedUrl)
        || getDirectPreviewMetadata(parsedUrl)
        || {
            photo_preview_url: parsedUrl.toString(),
            photo_thumbnail_url: null,
            photo_preview_mode: 'external',
            photo_preview_provider: parsedUrl.hostname.toLowerCase()
        };
};

const serializeEquipmentWithPreview = (equipment) => {
    if (!equipment) {
        return equipment;
    }

    const plainEquipment = typeof equipment.get === 'function'
        ? equipment.get({ plain: true })
        : { ...equipment };

    return {
        ...plainEquipment,
        ...getPhotoPreviewMetadata(plainEquipment.photo_url),
        qr_code_value: buildEquipmentQrValue(plainEquipment)
    };
};

const serializeEquipmentCollectionWithPreview = (equipmentItems = []) => {
    return equipmentItems.map(serializeEquipmentWithPreview);
};

module.exports = {
    buildEquipmentQrValue,
    getPhotoPreviewMetadata,
    serializeEquipmentWithPreview,
    serializeEquipmentCollectionWithPreview
};
