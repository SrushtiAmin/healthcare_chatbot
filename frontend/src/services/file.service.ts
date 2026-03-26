import { api } from './auth.service';

export interface UploadedFile {
    id: string;
    name: string;
    url: string;
    type: 'pdf' | 'image' | 'word' | 'powerpoint' | 'excel' | 'csv' | 'text' | 'other';
    createdAt: string;
}

export interface FileApiResponse {
    success: boolean;
    file: UploadedFile;
    message?: string;
}

export const fileService = {
    async uploadFile(file: File, sessionId?: string): Promise<UploadedFile> {
        const formData = new FormData();
        formData.append('file', file);
        if (sessionId) {
            formData.append('sessionId', sessionId);
        }

        const response = await api.post<any>('/api/file/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        // The controller returns { message, file } directly or wrapped. 
        // Based on my controller: res.status(201).json({ message, file });
        return response.data.file;
    },

    async getFiles(sessionId?: string): Promise<UploadedFile[]> {
        const response = await api.get<UploadedFile[]>('/api/file', {
            params: { sessionId }
        });
        return response.data;
    }
};
