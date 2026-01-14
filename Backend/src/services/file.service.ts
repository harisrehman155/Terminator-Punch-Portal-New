import * as FileModel from '../models/file.model';
import * as OrderModel from '../models/order.model';
import * as QuoteModel from '../models/quote.model';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import fs from 'fs';
import path from 'path';

/**
 * File Service - Business logic for file uploads
 */

// Allowed file types and size limits
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Validate file upload
 */
export const validateFile = (file: Express.Multer.File): void => {
  if (!file) {
    throw new ValidationError('No file provided');
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `File type ${file.mimetype} not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(`File size ${file.size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
  }
};

/**
 * Generate unique filename
 */
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  const extension = path.extname(originalName);
  const basename = path.basename(originalName, extension);
  return `${basename}_${timestamp}_${random}${extension}`;
};

/**
 * Upload file for order
 */
export const uploadOrderFile = async (
  file: Express.Multer.File,
  orderId: number,
  userId: number,
  userRole: string
): Promise<any> => {
  // Validate file
  validateFile(file);

  // Check if order exists and user has permission
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: Users can only upload to their own orders, admins can upload to any
  if (userRole !== 'ADMIN' && order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to upload files to this order');
  }

  const fileRole = userRole === 'ADMIN' ? 'ADMIN_RESPONSE' : 'CUSTOMER_UPLOAD';
  const roleFolder = userRole === 'ADMIN' ? 'admin' : 'customer';
  const orderFolder = order.order_no || orderId.toString();
  const orderDir = path.join(UPLOAD_DIR, 'orders', orderFolder, roleFolder);

  // Generate unique filename and move file
  const uniqueFilename = generateUniqueFilename(file.originalname);

  // Ensure directory exists
  if (!fs.existsSync(orderDir)) {
    fs.mkdirSync(orderDir, { recursive: true });
  }

  const filePath = path.join(orderDir, uniqueFilename);

  // Move file to destination
  fs.renameSync(file.path, filePath);

  // Create file record in database
  const fileRecord = await FileModel.create({
    stored_name: uniqueFilename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size_bytes: file.size,
    file_path: filePath,
    entity_type: 'ORDER',
    file_role: fileRole,
    entity_id: orderId,
    uploaded_by: userId,
  });

  if (userRole === 'ADMIN' && order.status !== 'COMPLETED') {
    await OrderModel.updateStatus(orderId, 'COMPLETED');
  }

  return FileModel.toFileResponse(fileRecord);
};

/**
 * Upload file for quote
 */
export const uploadQuoteFile = async (
  file: Express.Multer.File,
  quoteId: number,
  userId: number,
  userRole: string
): Promise<any> => {
  // Validate file
  validateFile(file);

  // Check if quote exists and user has permission
  const quote = await QuoteModel.findById(quoteId);
  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization: Users can only upload to their own quotes, admins can upload to any
  if (userRole !== 'ADMIN' && quote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to upload files to this quote');
  }

  const fileRole = userRole === 'ADMIN' ? 'ADMIN_RESPONSE' : 'CUSTOMER_UPLOAD';
  const roleFolder = userRole === 'ADMIN' ? 'admin' : 'customer';
  const quoteFolder = quote.quote_no || quoteId.toString();
  const quoteDir = path.join(UPLOAD_DIR, 'quotes', quoteFolder, roleFolder);

  // Generate unique filename and move file
  const uniqueFilename = generateUniqueFilename(file.originalname);

  // Ensure directory exists
  if (!fs.existsSync(quoteDir)) {
    fs.mkdirSync(quoteDir, { recursive: true });
  }

  const filePath = path.join(quoteDir, uniqueFilename);

  // Move file to destination
  fs.renameSync(file.path, filePath);

  // Create file record in database
  const fileRecord = await FileModel.create({
    stored_name: uniqueFilename,
    original_name: file.originalname,
    mime_type: file.mimetype,
    size_bytes: file.size,
    file_path: filePath,
    entity_type: 'QUOTE',
    file_role: fileRole,
    entity_id: quoteId,
    uploaded_by: userId,
  });

  return FileModel.toFileResponse(fileRecord);
};

/**
 * Get files for order
 */
export const getOrderFiles = async (
  orderId: number,
  userId: number,
  userRole: string
): Promise<any[]> => {
  // Check if order exists and user has permission
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new NotFoundError('Order not found');
  }

  // Authorization: Users can only view their own order files, admins can view any
  if (userRole !== 'ADMIN' && order.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view files for this order');
  }

  const files = await FileModel.findByEntity('order', orderId);
  return files.map(FileModel.toFileResponse);
};

/**
 * Get files for quote
 */
export const getQuoteFiles = async (
  quoteId: number,
  userId: number,
  userRole: string
): Promise<any[]> => {
  // Check if quote exists and user has permission
  const quote = await QuoteModel.findById(quoteId);
  if (!quote) {
    throw new NotFoundError('Quote not found');
  }

  // Authorization: Users can only view their own quote files, admins can view any
  if (userRole !== 'ADMIN' && quote.user_id !== userId) {
    throw new ForbiddenError('You do not have permission to view files for this quote');
  }

  const files = await FileModel.findByEntity('quote', quoteId);
  return files.map(FileModel.toFileResponse);
};

/**
 * Delete file
 */
export const deleteFile = async (
  fileId: number,
  userId: number,
  userRole: string
): Promise<void> => {
  // Get file record
  const file = await FileModel.findById(fileId);
  if (!file) {
    throw new NotFoundError('File not found');
  }

  // Authorization: Users can only delete their own uploaded files, admins can delete any
  if (userRole !== 'ADMIN' && file.uploaded_by !== userId) {
    throw new ForbiddenError('You do not have permission to delete this file');
  }

  // Delete physical file
  if (fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }

  // Delete database record
  await FileModel.deleteById(fileId);
};

/**
 * Filter order files by scope
 */
export const filterOrderFilesByScope = (files: FileModel.FileRecord[], scope: string) => {
  const normalizedScope = (scope || '').toLowerCase();
  if (normalizedScope === 'admin') {
    return files.filter(
      (file) => String(file.file_role || '').toUpperCase() === 'ADMIN_RESPONSE'
    );
  }
  if (normalizedScope === 'customer') {
    return files.filter((file) => {
      const role = String(file.file_role || '').toUpperCase();
      return role === 'CUSTOMER_UPLOAD' || role === 'ATTACHMENT';
    });
  }
  return files;
};

/**
 * Get user's uploaded files
 */
export const getUserFiles = async (userId: number): Promise<any[]> => {
  const files = await FileModel.findByUser(userId);
  return files.map(FileModel.toFileResponse);
};

/**
 * Copy quote files to order when quote is converted
 */
export const copyQuoteFilesToOrder = async (
  quoteId: number,
  orderId: number,
  quoteNo: string,
  orderNo: string
): Promise<void> => {
  const quoteFiles = await FileModel.findByEntity('quote', quoteId);

  // Only copy customer uploaded files (not admin responses)
  const customerFiles = quoteFiles.filter(
    (file) => String(file.file_role || '').toUpperCase() === 'CUSTOMER_UPLOAD'
  );

  for (const quoteFile of customerFiles) {
    try {
      // Source and destination paths
      const quoteFolder = quoteNo || quoteId.toString();
      const orderFolder = orderNo || orderId.toString();

      const sourcePath = quoteFile.file_path;
      const destDir = path.join(UPLOAD_DIR, 'orders', orderFolder, 'customer');
      const destPath = path.join(destDir, quoteFile.stored_name);

      // Ensure destination directory exists
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Copy the physical file
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);

        // Create new file record for the order
        await FileModel.create({
          stored_name: quoteFile.stored_name,
          original_name: quoteFile.original_name,
          mime_type: quoteFile.mime_type,
          size_bytes: quoteFile.size_bytes,
          file_path: destPath,
          entity_type: 'ORDER',
          file_role: 'CUSTOMER_UPLOAD',
          entity_id: orderId,
          uploaded_by: quoteFile.uploaded_by,
        });
      }
    } catch (error) {
      console.error(`Failed to copy file ${quoteFile.id} from quote to order:`, error);
      // Continue with other files even if one fails
    }
  }
};

/**
 * Get file record for download with authorization
 */
export const getFileForDownload = async (
  fileId: number,
  userId: number,
  userRole: string
): Promise<FileModel.FileRecord> => {
  const file = await FileModel.findById(fileId);
  if (!file) {
    throw new NotFoundError('File not found');
  }

  if (userRole !== 'ADMIN') {
    if (file.uploaded_by === userId) {
      return file;
    }

    const entityType = (file.entity_type || '').toUpperCase();
    if (entityType === 'ORDER') {
      const order = await OrderModel.findById(file.entity_id);
      if (!order) {
        throw new NotFoundError('Order not found');
      }
      if (order.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to access this file');
      }
    } else if (entityType === 'QUOTE') {
      const quote = await QuoteModel.findById(file.entity_id);
      if (!quote) {
        throw new NotFoundError('Quote not found');
      }
      if (quote.user_id !== userId) {
        throw new ForbiddenError('You do not have permission to access this file');
      }
    } else {
      throw new ForbiddenError('You do not have permission to access this file');
    }
  }

  if (!file.file_path || !fs.existsSync(file.file_path)) {
    throw new NotFoundError('File not found on disk');
  }

  return file;
};
