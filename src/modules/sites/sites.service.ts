import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Site, SiteDocument } from './schemas/site.schema';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';

@Injectable()
export class SitesService {
  constructor(
    @InjectModel(Site.name)
    private readonly siteModel: Model<SiteDocument>,
  ) {}

  async create(createSiteDto: CreateSiteDto): Promise<SiteDocument> {
    const createdSite = new this.siteModel(createSiteDto);
    return await createdSite.save();
  }

  async findAll(): Promise<SiteDocument[]> {
    return await this.siteModel.find().exec();
  }

  async findOne(id: string): Promise<SiteDocument> {
    const site = await this.siteModel
      .findById(id)
      .populate('updatedBy', 'name email')
      .exec();
    if (!site) {
      throw new NotFoundException(`Không tìm thấy Site có ID là: ${id}`);
    }
    return site;
  }

  async update(
    id: string,
    updateSiteDto: UpdateSiteDto,
  ): Promise<SiteDocument> {
    const updatedSite = await this.siteModel
      .findByIdAndUpdate(id, updateSiteDto, { new: true, runValidators: true })
      .exec();

    if (!updatedSite) {
      throw new NotFoundException(
        `Không tìm thấy Site có ID là: ${id} để cập nhật`,
      );
    }
    return updatedSite;
  }

  async remove(id: string): Promise<SiteDocument> {
    const deletedSite = await this.siteModel.findByIdAndDelete(id).exec();
    if (!deletedSite) {
      throw new NotFoundException(`Không tìm thấy Site có ID là: ${id} để xóa`);
    }
    return deletedSite;
  }
}
