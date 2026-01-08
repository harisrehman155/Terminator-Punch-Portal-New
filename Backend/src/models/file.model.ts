import { query, queryOne } from '../config/database';
import { DatabaseError, NotFoundError } from '../utils/errors';
import { getFileExtension, formatFileSize } from '../utils/helpers';
import { getLookupId } from '../utils/lookup.helper';

export interface FileRecord {
  id: number;
  entity_type_id: number;
  entity_type?: string;
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type?: string;
  size_bytes?: number;
  file_role_id: number;
  file_role?: string;
  entity_id: number;
  uploaded_by: number;
  created_at: Date;
}

/**
 * File Model - Database operations for file uploads
 */

/**
 * Create file record
 */
export const create = async (fileData: {
  original_name: string;
  stored_name: string;
  file_path: string;
  mime_type?: string;
  size_bytes?: number;
  entity_type: 'ORDER' | 'QUOTE' | 'order' | 'quote';
  file_role: 'CUSTOMER_UPLOAD' | 'ADMIN_RESPONSE' | 'ATTACHMENT' | string;
  entity_id: number;
  uploaded_by: number;
}): Promise<FileRecord> => {
  try {
    const entityTypeId = await getLookupId('entity_type', fileData.entity_type);
    if (!entityTypeId) {
      throw new DatabaseError('Entity type lookup not found');
    }

    const fileRoleId = await getLookupId('file_role', fileData.file_role);
    if (!fileRoleId) {
      throw new DatabaseError('File role lookup not found');
    }

    const result: any = await query(
      `INSERT INTO files (
        entity_type_id,
        entity_id,
        file_role_id,
        original_name,
        stored_name,
        file_path,
        mime_type,
        size_bytes,
        uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entityTypeId,
        fileData.entity_id,
        fileRoleId,
        fileData.original_name,
        fileData.stored_name,
        fileData.file_path,
        fileData.mime_type,
        fileData.size_bytes,
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
      `SELECT
        f.*,
        et.lookup_value as entity_type,
        fr.lookup_value as file_role
      FROM files f
      LEFT JOIN lookups et ON f.entity_type_id = et.id
      LEFT JOIN lookups fr ON f.file_role_id = fr.id
      WHERE f.id = ?`,
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
      `SELECT
        f.*,
        et.lookup_value as entity_type,
        fr.lookup_value as file_role
      FROM files f
      LEFT JOIN lookups et ON f.entity_type_id = et.id
      LEFT JOIN lookups fr ON f.file_role_id = fr.id
      WHERE LOWER(et.lookup_value) = ? AND f.entity_id = ?
      ORDER BY f.created_at DESC`,
      [entityType.toLowerCase(), entityId]
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
      `SELECT
        f.*,
        et.lookup_value as entity_type,
        fr.lookup_value as file_role
      FROM files f
      LEFT JOIN lookups et ON f.entity_type_id = et.id
      LEFT JOIN lookups fr ON f.file_role_id = fr.id
      WHERE f.uploaded_by = ?
      ORDER BY f.created_at DESC`,
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
    await query(
      `DELETE f
       FROM files f
       INNER JOIN lookups et ON f.entity_type_id = et.id
       WHERE LOWER(et.lookup_value) = ? AND f.entity_id = ?`,
      [entityType.toLowerCase(), entityId]
    );
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
    filename: file.stored_name,
    stored_name: file.stored_name,
    original_name: file.original_name,
    mime_type: file.mime_type,
    size_bytes: file.size_bytes,
    size_formatted: formatFileSize(file.size_bytes || 0),
    extension: getFileExtension(file.original_name),
    path: file.file_path,
    file_path: file.file_path,
    entity_type: file.entity_type,
    entity_id: file.entity_id,
    file_role: file.file_role,
    uploaded_by: file.uploaded_by,
    created_at: file.created_at,
  };
};
