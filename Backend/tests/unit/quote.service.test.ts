import * as QuoteService from '../../src/services/quote.service';
import * as QuoteModel from '../../src/models/quote.model';
import { NotFoundError, ValidationError, ForbiddenError } from '../../src/utils/errors';

// Mock the QuoteModel
jest.mock('../../src/models/quote.model');
const mockedQuoteModel = QuoteModel as jest.Mocked<typeof QuoteModel>;

describe('Quote Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuote', () => {
    it('should create a quote successfully', async () => {
      const userId = 1;
      const quoteData = {
        quote_type: 'DIGITIZING' as const,
        design_name: 'Test Design',
        height: 10,
        width: 5,
        unit: 'inch' as const,
        number_of_colors: 3,
        fabric: 'Cotton',
        is_urgent: 0,
      };

      const mockQuote = {
        id: 1,
        quote_no: 'QT-20241201-0001',
        service_type: 'DIGITIZING',
        status: 'PENDING',
        design_name: 'Test Design',
        height: 10,
        width: 5,
        unit: 'inch',
        number_of_colors: 3,
        fabric: 'Cotton',
        is_urgent: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockedQuoteModel.create.mockResolvedValue(mockQuote);
      mockedQuoteModel.toQuoteResponse.mockReturnValue(mockQuote);

      const result = await QuoteService.createQuote(userId, quoteData);

      expect(mockedQuoteModel.create).toHaveBeenCalledWith(userId, quoteData);
      expect(result).toEqual(mockQuote);
    });

    it('should validate quote type specific fields', async () => {
      const userId = 1;
      const invalidQuoteData = {
        quote_type: 'DIGITIZING' as const,
        design_name: 'Test Design',
        // Missing number_of_colors for DIGITIZING
      };

      await expect(
        QuoteService.createQuote(userId, invalidQuoteData)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('getQuoteById', () => {
    it('should return quote for owner', async () => {
      const quoteId = 1;
      const userId = 1;
      const userRole = 'USER';

      const mockQuote = {
        id: 1,
        user_id: 1,
        quote_no: 'QT-20241201-0001',
        service_type: 'DIGITIZING',
        status: 'PENDING',
        design_name: 'Test Design',
        user_name: 'Test User',
        user_email: 'test@example.com',
        user_company: 'Test Company',
      };

      mockedQuoteModel.findByIdWithUser.mockResolvedValue(mockQuote);
      mockedQuoteModel.toQuoteResponse.mockReturnValue(mockQuote);

      const result = await QuoteService.getQuoteById(quoteId, userId, userRole);

      expect(mockedQuoteModel.findByIdWithUser).toHaveBeenCalledWith(quoteId);
      expect(result).toEqual({
        ...mockQuote,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          company: 'Test Company',
        },
      });
    });

    it('should return quote for admin', async () => {
      const quoteId = 1;
      const userId = 2; // Different user
      const userRole = 'ADMIN';

      const mockQuote = {
        id: 1,
        user_id: 1, // Different from userId
        quote_no: 'QT-20241201-0001',
        service_type: 'DIGITIZING',
        status: 'PENDING',
        design_name: 'Test Design',
        user_name: 'Test User',
        user_email: 'test@example.com',
        user_company: 'Test Company',
      };

      mockedQuoteModel.findByIdWithUser.mockResolvedValue(mockQuote);
      mockedQuoteModel.toQuoteResponse.mockReturnValue(mockQuote);

      const result = await QuoteService.getQuoteById(quoteId, userId, userRole);

      expect(result).toEqual({
        ...mockQuote,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          company: 'Test Company',
        },
      });
    });

    it('should throw ForbiddenError for non-owner user', async () => {
      const quoteId = 1;
      const userId = 2;
      const userRole = 'USER';

      const mockQuote = {
        id: 1,
        user_id: 1, // Different from userId
        quote_no: 'QT-20241201-0001',
      };

      mockedQuoteModel.findByIdWithUser.mockResolvedValue(mockQuote);

      await expect(
        QuoteService.getQuoteById(quoteId, userId, userRole)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw NotFoundError for non-existent quote', async () => {
      const quoteId = 999;
      const userId = 1;
      const userRole = 'USER';

      mockedQuoteModel.findByIdWithUser.mockResolvedValue(null);

      await expect(
        QuoteService.getQuoteById(quoteId, userId, userRole)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateQuote', () => {
    it('should update quote for owner', async () => {
      const quoteId = 1;
      const userId = 1;
      const userRole = 'USER';
      const updateData = {
        design_name: 'Updated Design',
      };

      const mockQuote = {
        id: 1,
        user_id: 1,
        status: 'PENDING',
      };

      const updatedQuote = {
        ...mockQuote,
        design_name: 'Updated Design',
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);
      mockedQuoteModel.update.mockResolvedValue(updatedQuote);
      mockedQuoteModel.toQuoteResponse.mockReturnValue(updatedQuote);

      const result = await QuoteService.updateQuote(
        quoteId,
        updateData,
        userId,
        userRole
      );

      expect(mockedQuoteModel.update).toHaveBeenCalledWith(quoteId, updateData);
      expect(result).toEqual(updatedQuote);
    });

    it('should throw ForbiddenError when user tries to update non-pending quote', async () => {
      const quoteId = 1;
      const userId = 1;
      const userRole = 'USER';
      const updateData = {
        design_name: 'Updated Design',
      };

      const mockQuote = {
        id: 1,
        user_id: 1,
        status: 'PRICED', // Not PENDING
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);

      await expect(
        QuoteService.updateQuote(quoteId, updateData, userId, userRole)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('updateQuotePricing', () => {
    it('should update quote pricing for admin', async () => {
      const quoteId = 1;
      const pricingData = {
        price: 150.5,
        currency: 'USD',
        remarks: 'Test pricing',
      };
      const userRole = 'ADMIN';

      const mockQuote = {
        id: 1,
        status: 'PENDING',
      };

      const updatedQuote = {
        ...mockQuote,
        price: 150.5,
        currency: 'USD',
        status: 'PRICED',
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);
      mockedQuoteModel.updatePricing.mockResolvedValue(updatedQuote);
      mockedQuoteModel.toQuoteResponse.mockReturnValue(updatedQuote);

      const result = await QuoteService.updateQuotePricing(
        quoteId,
        pricingData,
        userRole
      );

      expect(mockedQuoteModel.updatePricing).toHaveBeenCalledWith(
        quoteId,
        pricingData
      );
      expect(result).toEqual(updatedQuote);
    });

    it('should throw ForbiddenError for non-admin', async () => {
      const quoteId = 1;
      const pricingData = {
        price: 150,
      };
      const userRole = 'USER';

      await expect(
        QuoteService.updateQuotePricing(quoteId, pricingData, userRole)
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw ValidationError for non-pending quote', async () => {
      const quoteId = 1;
      const pricingData = {
        price: 150,
      };
      const userRole = 'ADMIN';

      const mockQuote = {
        id: 1,
        status: 'CONVERTED',
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);

      await expect(
        QuoteService.updateQuotePricing(quoteId, pricingData, userRole)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('convertQuoteToOrder', () => {
    it('should convert quote to order for owner', async () => {
      const quoteId = 1;
      const userId = 1;
      const userRole = 'USER';

      const mockQuote = {
        id: 1,
        user_id: 1,
        status: 'PRICED',
        service_type: 'DIGITIZING',
        design_name: 'Test Design',
      };

      const mockOrder = {
        id: 1,
        order_no: 'TP-20241201-0001',
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);
      // Mock the conversion process
      mockedQuoteModel.convertToOrder.mockResolvedValue(undefined);
      mockedQuoteModel.findById.mockResolvedValueOnce(mockQuote);

      // Mock OrderService.createOrder (we'll need to mock this)
      const OrderService = require('../../src/services/order.service');
      OrderService.createOrder = jest.fn().mockResolvedValue(mockOrder);

      const result = await QuoteService.convertQuoteToOrder(
        quoteId,
        userId,
        userRole
      );

      expect(mockedQuoteModel.convertToOrder).toHaveBeenCalledWith(quoteId, mockOrder.id);
      expect(result).toHaveProperty('quote');
      expect(result).toHaveProperty('order');
    });

    it('should throw ValidationError for non-priced quote', async () => {
      const quoteId = 1;
      const userId = 1;
      const userRole = 'USER';

      const mockQuote = {
        id: 1,
        user_id: 1,
        status: 'PENDING', // Not PRICED
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);

      await expect(
        QuoteService.convertQuoteToOrder(quoteId, userId, userRole)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('deleteQuote', () => {
    it('should delete quote for admin', async () => {
      const quoteId = 1;
      const userRole = 'ADMIN';

      const mockQuote = {
        id: 1,
        converted_order_id: null, // Not converted
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);
      mockedQuoteModel.deleteById.mockResolvedValue(undefined);

      await expect(
        QuoteService.deleteQuote(quoteId, userRole)
      ).resolves.not.toThrow();

      expect(mockedQuoteModel.deleteById).toHaveBeenCalledWith(quoteId);
    });

    it('should throw ForbiddenError for non-admin', async () => {
      const quoteId = 1;
      const userRole = 'USER';

      await expect(QuoteService.deleteQuote(quoteId, userRole)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('should throw ValidationError for converted quote', async () => {
      const quoteId = 1;
      const userRole = 'ADMIN';

      const mockQuote = {
        id: 1,
        converted_order_id: 123, // Already converted
      };

      mockedQuoteModel.findById.mockResolvedValue(mockQuote);

      await expect(
        QuoteService.deleteQuote(quoteId, userRole)
      ).rejects.toThrow(ValidationError);
    });
  });
});
