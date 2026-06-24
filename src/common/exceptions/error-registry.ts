// src/constants/error-registry.ts
import { HttpStatus } from '@nestjs/common';

export const ERROR_REGISTRY = {
  // 1. Hệ thống chung (General)
  INTERNAL_SERVER_ERROR: {
    errorCode: 'ERR_000',
    message: 'Có lỗi xảy ra, vui lòng thử lại sau',
    status: HttpStatus.INTERNAL_SERVER_ERROR,
  },
  BAD_REQUEST: {
    errorCode: 'ERR_001',
    message: 'Dữ liệu không hợp lệ',
    status: HttpStatus.BAD_REQUEST,
  },

  // 2. Xác thực & Phân quyền (Auth & Security)
  UNAUTHORIZED: {
    errorCode: 'AUTH_001',
    message: 'Bạn chưa đăng nhập hoặc token đã hết hạn',
    status: HttpStatus.UNAUTHORIZED,
  },
  FORBIDDEN: {
    errorCode: 'AUTH_002',
    message: 'Bạn không có quyền thực hiện hành động này',
    status: HttpStatus.FORBIDDEN,
  },
  INVALID_CREDENTIALS: {
    errorCode: 'AUTH_003',
    message: 'Thông tin đăng nhập không hợp lệ',
    status: HttpStatus.UNAUTHORIZED,
  },
  INVALID_REFRESH_TOKEN: {
    errorCode: 'AUTH_004',
    message: 'Refresh token không hợp lệ',
    status: HttpStatus.UNAUTHORIZED,
  },
  TOKEN_EXPIRED: {
    errorCode: 'AUTH_005',
    message: 'Refresh token đã hết hạn',
    status: HttpStatus.UNAUTHORIZED,
  },
  REFRESH_TOKEN_PENDING: {
    errorCode: 'AUTH_006',
    message: 'Refresh token đang được tạo mới',
    status: HttpStatus.UNAUTHORIZED,
  },
  USER_NOT_ACTIVE: {
    errorCode: 'AUTH_007',
    message: 'Người dùng chưa được kích hoạt',
    status: HttpStatus.UNAUTHORIZED,
  },
  USER_DELETED: {
    errorCode: 'AUTH_008',
    message: 'Người dùng đã bị xóa',
    status: HttpStatus.UNAUTHORIZED,
  },

  // 3. Người dùng (User)
  USER_NOT_FOUND: {
    errorCode: 'USER_001',
    message: 'Người dùng không tồn tại',
    status: HttpStatus.NOT_FOUND,
  },
  EMAIL_ALREADY_EXISTS: {
    errorCode: 'USER_002',
    message: 'Email này đã được sử dụng',
    status: HttpStatus.CONFLICT,
  },

  // 4. Sản phẩm & Đơn hàng (Product & Order)
  PRODUCT_NOT_FOUND: {
    errorCode: 'PROD_001',
    message: 'Sản phẩm không tìm thấy',
    status: HttpStatus.NOT_FOUND,
  },
  OUT_OF_STOCK: {
    errorCode: 'PROD_002',
    message: 'Sản phẩm đã hết hàng',
    status: HttpStatus.CONFLICT,
  },
  ORDER_NOT_FOUND: {
    errorCode: 'ORD_001',
    message: 'Đơn hàng không tồn tại',
    status: HttpStatus.NOT_FOUND,
  },
  ORDER_STATUS_INVALID: {
    errorCode: 'ORD_002',
    message: 'Không thể chuyển trạng thái đơn hàng này',
    status: HttpStatus.BAD_REQUEST,
  },

  // 5. Database & Ràng buộc (Database constraints)

  DATABASE_VALIDATION_ERROR: {
    errorCode: 'DB_VAL_001',
    message: 'Dữ liệu không hợp lệ',
    status: HttpStatus.BAD_REQUEST,
  },
  DATABASE_NOT_FOUND: {
    errorCode: 'DB_NF_001',
    message: 'Dữ liệu không tìm thấy',
    status: HttpStatus.NOT_FOUND,
  },
  DATABASE_CONFLICT: {
    errorCode: 'DB_CON_001',
    message: 'Dữ liệu bị trùng lặp',
    status: HttpStatus.CONFLICT,
  },
} as const;
