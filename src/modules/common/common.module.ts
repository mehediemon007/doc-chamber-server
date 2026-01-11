import { Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase-storage.service';

@Module({
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService], // Export so others can use it
})
export class CommonModule {}
