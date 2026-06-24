import { ApiProperty } from '@nestjs/swagger'; // Import ApiProperty
import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({
    example: 'Kênh Tin Tức ABC',
    description: 'Tiêu đề hoặc tên của trang web',
  })
  @IsString({ message: 'Title phải là một chuỗi ký tự' })
  @IsNotEmpty({ message: 'Title không được để trống' })
  title: string;

  @ApiProperty({
    example: 'Trang web cập nhật tin tức công nghệ 24/7',
    description: 'Mô tả ngắn gọn về trang web',
    required: false,
  })
  @IsString({ message: 'Description phải là một chuỗi ký tự' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 'https://example.com',
    description: 'Đường dẫn liên kết hình ảnh của trang web',
    required: false,
  })
  @IsString({ message: 'Link ảnh phải là một chuỗi ký tự' })
  @IsOptional()
  linkPhoto?: string;

  @ApiProperty({
    example: '64f1a2b3c4d5e6f7a8b9c0d1',
    description: 'ID người dùng thực hiện cập nhật hệ thống (MongoDB ObjectId)',
    required: false,
  })
  @IsMongoId({ message: 'updatedBy phải là một định dạng MongoDB ID hợp lệ' })
  @IsOptional()
  updatedBy?: string;
}
