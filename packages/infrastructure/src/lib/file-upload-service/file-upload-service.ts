import { AuthUser } from '@event-engine/infrastructure/auth-service/auth-service';

export const SERVICE_NAME_FILE_UPLOAD_SERVICE = 'FileUploadService';

export type DeleteFileProps = {
  fileId: string;
  user: AuthUser;
};
export type GetFileProps = {
  key: string;
  user: AuthUser;
};
export type BucketName = { bucketName: string };
export type FileKey = { key: string };

export interface FileUploadService {
  getSharedFileUrl: (key: string | FileKey) => Promise<string>;
  getFileUrl: (props: GetFileProps) => Promise<string>;
  deleteFile: (props: DeleteFileProps) => Promise<void>;
  getUploadUrl: (props: GetFileProps) => Promise<string>;
  createBucket: (bucketName: string | BucketName) => Promise<void>;
}
