export const FILE_ERROR_MESSAGES = {
    FILE_EMPTY: "Rejection: The uploaded file appears to be empty or contains no extractable text.",
    FILE_NOT_HEALTH_RELATED: "Rejection: The uploaded document does not appear to be healthcare-related.",
    INVALID_FILE_TYPE: "Invalid file type. Please upload a supported medical document.",
    EXTRACTION_FAILED: "Extraction failed for the uploaded document."
};

export const SUPPORTED_FILE_TYPES = {
    PDF: 'pdf',
    IMAGE: 'image',
    WORD: 'word',
    POWERPOINT: 'powerpoint',
    EXCEL: 'excel',
    CSV: 'csv',
    TEXT: 'text',
    OTHER: 'other'
} as const;

export type FileType = typeof SUPPORTED_FILE_TYPES[keyof typeof SUPPORTED_FILE_TYPES];

export const MIMETYPE_TO_TYPE: Record<string, FileType> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'image',
    'image/png': 'image',
    'image/webp': 'image',
    'image/gif': 'image',
    'text/plain': 'text',
    'text/markdown': 'text',
    'text/csv': 'csv',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
    'application/msword': 'word',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
    'application/vnd.ms-excel': 'excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'powerpoint',
    'application/vnd.ms-powerpoint': 'powerpoint'
};

export const EXTENSION_TO_TYPE: Record<string, FileType> = {
    '.pdf': 'pdf',
    '.docx': 'word',
    '.doc': 'word',
    '.pptx': 'powerpoint',
    '.ppt': 'powerpoint',
    '.xlsx': 'excel',
    '.xls': 'excel',
    '.csv': 'csv',
    '.txt': 'text',
    '.md': 'text'
};

export const ALLOWED_MIMETYPES = Object.keys(MIMETYPE_TO_TYPE);
export const ALLOWED_EXTENSIONS = Object.keys(EXTENSION_TO_TYPE);
