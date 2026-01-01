import { query, queryOne } from '../config/database';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { getFileExtension, formatFileSize } from '../utils/helpers';

export interface FileRecord {
  id: number;
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  entity_type: 'order' | 'quote';
  entity_id: number;
  uploaded_by: number;
  created_at: Date;
  updated_at: Date;
}

/**
 * File Model - Database operations for file uploads
 */

/**
 * Create file record
 */
export const create = async (fileData: {
  filename: string;
  original_name: string;
  mime_type: string;
  size: number;
  path: string;
  entity_type: 'order' | 'quote';
  entity_id: number;
  uploaded_by: number;
}): Promise<FileRecord> => {
  try {
    const result: any = await query(
      `INSERT INTO files (filename, original_name, mime_type, size, path, entity_type, entity_id, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        fileData.filename,
        fileData.original_name,
        fileData.mime_type,
        fileData.size,
        fileData.path,
        fileData.entity_type,
        fileData.entity_id,
        fileData.uploaded_by,
      ]
    );

    const fileId = result.insertId;
    const file = await findById(fileId);

    if (!file) {
      throw new DatabaseError('Failed to retrieve created file record');
    }

    return file;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new DatabaseError('File record already exists');
    }
    throw new DatabaseError('Failed to create file record');
  }
};

/**
 * Find file by ID
 */
export const findById = async (fileId: number): Promise<FileRecord | null> => {
  try {
    const file = await queryOne<FileRecord>(
      'SELECT * FROM files WHERE id = ?',
      [fileId]
    );
    return file;
  } catch (error) {
    throw new DatabaseError('Failed to find file');
  }
};

/**
 * Find files by entity (order or quote)
 */
export const findByEntity = async (
  entityType: 'order' | 'quote',
  entityId: number
): Promise<FileRecord[]> => {
  try {
    const files = await query<FileRecord[]>(
      'SELECT * FROM files WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [entityType, entityId]
    );
    return files;
  } catch (error) {
    throw new DatabaseError('Failed to find files by entity');
  }
};

/**
 * Find files by user
 */
export const findByUser = async (userId: number): Promise<FileRecord[]> => {
  try {
    const files = await query<FileRecord[]>(
      'SELECT * FROM files WHERE uploaded_by = ? ORDER BY created_at DESC',
      [userId]
    );
    return files;
  } catch (error) {
    throw new DatabaseError('Failed to find files by user');
  }
};

/**
 * Delete file record
 */
export const deleteById = async (fileId: number): Promise<void> => {
  try {
    await query('DELETE FROM files WHERE id = ?', [fileId]);
  } catch (error) {
    throw new DatabaseError('Failed to delete file record');
  }
};

/**
 * Delete files by entity
 */
export const deleteByEntity = async (
  entityType: 'order' | 'quote',
  entityId: number
): Promise<void> => {
  try {
    await query('DELETE FROM files WHERE entity_type = ? AND entity_id = ?', [
      entityType,
      entityId,
    ]);
  } catch (error) {
    throw new DatabaseError('Failed to delete files by entity');
  }
};

/**
 * Convert FileRecord to response format
 */
export const toFileResponse = (file: FileRecord) => {
  return {
    id: file.id,
    filename: file.filename,
    original_name: file.original_name,
    mime_type: file.mime_type,
    size: file.size,
    size_formatted: formatFileSize(file.size),
    extension: getFileExtension(file.original_name),
    path: file.path,
    entity_type: file.entity_type,
    entity_id: file.entity_id,
    uploaded_by: file.uploaded_by,
    created_at: file.created_at,
    updated_at: file.updated_at,
  };
};
